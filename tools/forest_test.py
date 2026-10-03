# -*- coding: utf-8 -*-
"""星坠之谜 · 林间异闻测试：岔路口搜寻调度与一次性事件 / 六则异闻的检定收益与代价 /
猎人授卡 / 蛾群遭遇 / 石铭入笔记 / 升级祝福拦截下的流程兼容"""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file:///' + os.path.join(ROOT, 'index.html').replace('\\', '/')
SHOT = os.path.join(ROOT, 'tools', 'shots')
os.makedirs(SHOT, exist_ok=True)

errors = []
console_msgs = []

def check(cond, msg):
    if cond:
        print('  OK ' + msg)
    else:
        print('  FAIL ' + msg)
        errors.append(msg)

def ev(page, expr):
    return page.evaluate(expr)

def goto_scene(page, sid):
    page.evaluate('Story.goto("%s")' % sid)
    page.wait_for_timeout(300)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    page.evaluate('dismissBlessings()')

def click_choice(page, text):
    page.locator('#choices .choice-btn', has_text=text).first.click()
    page.wait_for_timeout(400)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    page.evaluate('dismissBlessings()')

def force_random(page, val):
    """固定 Math.random 用于检定：0.99 → 骰 20 必成功；0 → 骰 1 必失败"""
    page.evaluate('window.__origRandom = Math.random; Math.random = function(){ return %s; }' % val)

def restore_random(page):
    page.evaluate('Math.random = window.__origRandom')

DISMISS_JS = '''
window.dismissBlessings = async function () {
  for (let i = 0; i < 40; i++) {
    if (!(G.state && G.state.scene === 'blessing')) return G.state ? G.state.scene : null;
    const btns = document.querySelectorAll('#choices .choice-btn');
    if (btns.length) btns[btns.length - 1].click();
    await new Promise(r => setTimeout(r, 150));
  }
  return G.state ? G.state.scene : null;
};
'''

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    page.on('console', lambda m: console_msgs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    # ---- 清空存储，从零开始 ----
    page.goto(URL)
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_timeout(600)
    page.evaluate(DISMISS_JS)

    # ---- 新游戏（战士）→ 教学战斗 → 抵达城镇 ----
    page.click('#t-new')
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.locator('#choices .choice-btn', has_text='战士').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.locator('#choices .choice-btn', has_text='磨砺').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.locator('#choices .choice-btn', has_text='迎战').click()
    page.wait_for_timeout(600)
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1200)
    page.locator('#btn-skip-reward').click()
    page.wait_for_timeout(400)
    page.evaluate('dismissBlessings()')

    # ================= 1. 调度与一次性 =================
    print('== 调度与一次性 ==')
    goto_scene(page, 'crossroads')
    check(any('搜寻岔路口四周' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '岔路口出现「搜寻岔路口四周」选项')
    check(ev(page, 'DATA.FOREST_EVENTS.length') == 6, '林间异闻共 6 则')

    seen = []
    for i in range(7):
        goto_scene(page, 'forest_explore')
        seen.append(ev(page, 'G.state.scene'))
    check(set(seen[:6]) == set(ev(page, 'DATA.FOREST_EVENTS')), '前六次搜寻覆盖全部 6 则异闻（%s）' % seen[:6])
    check(seen[6] == 'forest_explore_empty', '六则全部触发后落入「林间搜遍」场景')
    check(ev(page, 'G.state.stats.forestExplored') == 7, '林间探索计数 7（%d）' % ev(page, 'G.state.stats.forestExplored'))
    page.screenshot(path=os.path.join(SHOT, '58_forest_explore_empty.png'))

    # ================= 2. 六则异闻：检定收益与代价 =================
    print('== 异闻检定 ==')
    # 猎人的歇脚棚：魅力成功 → 猎人授卡【回气】
    force_random(page, 0.99)
    goto_scene(page, 'fe_hut')
    click_choice(page, '留下来')
    restore_random(page)
    check(ev(page, 'G.state.deck.includes("second_wind")'), '歇脚棚魅力成功：猎人传授【回气】')
    # 歇脚棚失败：只翻到火钱
    force_random(page, 0)
    goto_scene(page, 'fe_hut')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '留下来')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 12, '歇脚棚魅力失败：翻到 12 金币火钱')

    # 蛾群夜舞：敏捷失败 → 星蛾围攻
    force_random(page, 0)
    goto_scene(page, 'fe_moths')
    click_choice(page, '张开斗篷')
    restore_random(page)
    page.locator('#choices .choice-btn', has_text='应战').click()
    page.wait_for_timeout(600)
    check(ev(page, '!!Combat.C') and ev(page, 'Combat.C.enemies.length') == 3, '蛾群检定失败：星蛾 ×3 围攻')
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(200)
    goto_scene(page, 'crossroads')

    # 苔石路标：智力成功 → 石铭入笔记
    force_random(page, 0.99)
    goto_scene(page, 'fe_stone')
    click_choice(page, '剥开苔衣')
    restore_random(page)
    check(ev(page, 'G.state.journal.notes.some(n => n.id === "forest_marks")'), '路标智力成功：石铭记入笔记')
    check('归途' in page.locator('#scene-text').inner_text(), '石铭文本含守塔人的诗')

    # 星蜂的空树：力量失败 → 蜇伤
    force_random(page, 0)
    goto_scene(page, 'fe_hivetree')
    hp0 = ev(page, 'G.state.player.hp')
    click_choice(page, '撬开树洞')
    restore_random(page)
    check(ev(page, 'G.state.player.hp') == hp0 - 8, '空树力量失败：蜂群蜇伤 -8 生命')

    # 陷阱线：敏捷成功 → 雪兔与药
    force_random(page, 0.99)
    goto_scene(page, 'fe_trapline')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '收陷阱')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 30 and ev(page, '(G.state.items.potion || 0) >= 1'),
          '陷阱线敏捷成功：30 金币 + 治疗药水')

    # 巨狼残骸：敏捷成功 → 行囊与火油
    force_random(page, 0.99)
    goto_scene(page, 'fe_wolfbones')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '搜寻狼骨')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 28 and ev(page, '(G.state.items.firebomb || 0) >= 1'),
          '狼骨敏捷成功：28 金币 + 火焰瓶')
    page.screenshot(path=os.path.join(SHOT, '59_forest_event.png'))

    # ================= 3. 与升级祝福的兼容 =================
    print('== 祝福拦截兼容 ==')
    check(ev(page, '(G.state.stats.explored || 0) === 0'), '林间异闻不占矿坑探索计数')
    page.evaluate('G.state.flags.pendingBless = 1')
    page.evaluate('Story.goto("crossroads")')
    page.wait_for_timeout(300)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    check(ev(page, 'G.state.scene') == 'blessing', '林间异闻流程同样被祝福拦截')
    page.locator('#choices .choice-btn', has_text='都不要').first.click()
    page.wait_for_timeout(400)
    check(ev(page, 'G.state.scene') == 'crossroads', '放弃祝福后回到岔路口')

    browser.close()

print('')
if console_msgs:
    print('浏览器 console 警告/错误:')
    for t, m in console_msgs[:20]:
        print('  [%s] %s' % (t, m))
print('')
if errors:
    print('✗ 测试失败 %d 项:' % len(errors))
    for e in errors:
        if e:
            print('  - ' + e)
    sys.exit(1)
print('✓ 林间异闻测试全部通过')
