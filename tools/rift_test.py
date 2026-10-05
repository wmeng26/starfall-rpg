# -*- coding: utf-8 -*-
"""星坠之谜 · 坠星裂谷测试：星核抉择后的新增第四章 / 枢纽选项与往返通路 /
裂谷异闻调度与六则残迹的检定收益与代价 / 星鸣授卡 / 影之先驱（含质问削弱）/
先驱战后谷道直通塔下营地 / 裂谷向成就"""
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
    page.wait_for_timeout(150)
    # 祝福拦截跳回目的地后文字机会重新开始：选项尚未渲染则再跳过一次
    if not page.locator('#choices .choice-btn').count():
        page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
        page.wait_for_timeout(100)

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

    # ---- 新游戏（战士）→ 教学战斗 → 模拟矿坑头目已倒（裂谷的剧情前提） ----
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
    page.evaluate('G.state.flags.bossDown = true; Quest.add(G.state, "main_rift")')

    # ================= 1. 裂谷枢纽 =================
    print('== 裂谷枢纽 ==')
    goto_scene(page, 'rift_gate')
    opts = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('沿谷道向塔影推进' in t for t in opts), '枢纽出现遭遇战选项')
    check(any('搜寻星坠残迹' in t for t in opts), '枢纽出现裂谷异闻搜寻选项')
    check(any('聆听谷底的星鸣' in t for t in opts), '枢纽出现星鸣检定选项')
    check(any('迎着塔影下行' in t for t in opts), '先驱未败：出现「迎着塔影下行」')
    check(any('退回矿坑入口' in t for t in opts), '先驱未败：可退回矿坑入口')
    check(not any('沿先驱让开的谷道前行' in t for t in opts), '先驱未败：不显示直通塔下营地')
    page.screenshot(path=os.path.join(SHOT, '60_rift_gate.png'))

    # ---- 往返通路：矿坑入口 → 裂谷 ----
    goto_scene(page, 'mine_entrance')
    check(any('沿山腰的伤疤北行' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '矿坑入口出现裂谷通路（头目已倒）')
    click_choice(page, '沿山腰的伤疤北行')
    check(ev(page, 'G.state.scene') == 'rift_gate', '矿坑入口北行进入裂谷')

    # ================= 2. 调度与一次性 =================
    print('== 调度与一次性 ==')
    force_random(page, 0.99)   # 固定抽取顺序（每次取剩余池末位），保证确定性
    seen = []
    for i in range(7):
        goto_scene(page, 'rift_explore')
        seen.append(ev(page, 'G.state.scene'))
    restore_random(page)
    check(set(seen[:6]) == set(ev(page, 'DATA.RIFT_EVENTS')), '前六次搜寻覆盖全部 6 则异闻（%s）' % seen[:6])
    check(seen[6] == 'rift_explore_empty', '六则全部触发后落入「裂谷搜遍」场景')
    check(ev(page, 'G.state.stats.riftExplored') == 7, '裂谷探索计数 7（%d）' % ev(page, 'G.state.stats.riftExplored'))

    # ================= 3. 六则异闻：检定收益与代价 =================
    print('== 异闻检定 ==')
    # 燃烧的星屑：敏捷成功 → 能量药水；失败 → 灼伤 -7
    force_random(page, 0.99)
    goto_scene(page, 're_ember')
    click_choice(page, '封一撮星火')
    restore_random(page)
    check(ev(page, '(G.state.items.energy_potion || 0) >= 1'), '星屑敏捷成功：获得能量药水')
    force_random(page, 0)
    goto_scene(page, 're_ember')
    hp0 = ev(page, 'G.state.player.hp')
    click_choice(page, '封一撮星火')
    restore_random(page)
    check(ev(page, 'G.state.player.hp') == hp0 - 7, '星屑敏捷失败：火星灼伤 -7 生命')

    # 冻结的商队：力量成功 → 55 金币 + 大治疗药水；只取铜币 → 15 金币 + 笔记
    force_random(page, 0.99)
    goto_scene(page, 're_frozen')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '撬开车斗的铜锁')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 55 and ev(page, '(G.state.items.big_potion || 0) >= 1'),
          '商队力量成功：55 金币 + 大治疗药水')
    check(ev(page, 'G.state.journal.notes.some(n => n.id === "frozen_moment")'), '商队异闻笔记「打结的时间」已记录')
    goto_scene(page, 're_frozen')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '只取走死者指间的铜币')
    check(ev(page, 'G.state.player.gold') == gold0 + 15, '商队只取铜币：15 金币')

    # 星纹石柱：智力成功 → 石铭笔记；敏捷成功 → 星辉露珠（此前无获取渠道）
    force_random(page, 0.99)
    goto_scene(page, 're_pillar')
    click_choice(page, '拓印柱身的刻字')
    check(ev(page, 'G.state.journal.notes.some(n => n.id === "rift_pillar")'), '石柱智力成功：刻字笔记已记录')
    goto_scene(page, 're_pillar')
    click_choice(page, '采下石缝间的星苔')
    restore_random(page)
    check(ev(page, '(G.state.items.star_dew || 0) >= 1'), '石柱敏捷成功：获得星辉露珠')

    # 六座石冢：魅力成功 → 石冢笔记；翻检供奉成功 → 45 金币 + 6 生命代价
    force_random(page, 0.99)
    goto_scene(page, 're_cairns')
    click_choice(page, '向石冢致意')
    check(ev(page, 'G.state.journal.notes.some(n => n.id === "rift_cairns")'), '石冢魅力成功：石冢笔记已记录')
    goto_scene(page, 're_cairns')
    gold0 = ev(page, 'G.state.player.gold')
    hp0 = ev(page, 'G.state.player.hp')
    click_choice(page, '翻检石冢上的供奉')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 45, '翻检供奉成功：45 金币')
    check(ev(page, 'G.state.player.hp') == hp0 - 6, '攫取供奉的代价：-6 生命')

    # 星屑兽的巢：敏捷成功 → 65 金币；失败 → 母兽归来开战
    force_random(page, 0.99)
    goto_scene(page, 're_houndnest')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '摸走巢心的星髓矿石')
    restore_random(page)
    check(ev(page, 'G.state.player.gold') == gold0 + 65, '兽巢敏捷成功：星髓矿石 65 金币')
    force_random(page, 0)
    goto_scene(page, 're_houndnest')
    click_choice(page, '摸走巢心的星髓矿石')
    restore_random(page)
    page.locator('#choices .choice-btn', has_text='应战').click()
    page.wait_for_timeout(600)
    check(ev(page, '!!Combat.C') and ev(page, 'Combat.C.enemies.length') == 2, '兽巢敏捷失败：星陨兽与猎犬合围')
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(200)
    goto_scene(page, 'rift_gate')

    # 旧石阶：敏捷成功 → 遗物·悬羊铜铃（首件敏捷检定遗物）
    force_random(page, 0.99)
    goto_scene(page, 're_stair')
    click_choice(page, '攀上残阶')
    restore_random(page)
    check(ev(page, 'G.state.relics.includes("goat_bell")'), '残阶敏捷成功：获得遗物·悬羊铜铃')
    goto_scene(page, 're_stair')
    gold0 = ev(page, 'G.state.player.gold')
    click_choice(page, '在阶下碎石里翻检')
    check(ev(page, 'G.state.player.gold') == gold0 + 15, '阶下碎石翻检：15 金币')
    page.screenshot(path=os.path.join(SHOT, '61_rift_event.png'))

    # ================= 4. 谷底星鸣 → 授卡 =================
    print('== 星鸣授卡 ==')
    force_random(page, 0.99)
    goto_scene(page, 'rift_gate')
    click_choice(page, '聆听谷底的星鸣')
    restore_random(page)
    check(ev(page, 'G.state.deck.includes("falling_star")'), '星鸣智力成功：习得【坠星击】')
    check(ev(page, 'G.state.journal.notes.some(n => n.id === "star_echo")'), '星鸣笔记「谷底的星鸣」已记录')
    check(not any('聆听谷底的星鸣' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '星鸣为一次性检定，选项消失')

    # ================= 5. 影之先驱 =================
    print('== 影之先驱 ==')
    goto_scene(page, 'herald_pre')
    check(any('质问它' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '先驱战前出现质问检定选项')
    page.evaluate('G.state.player.hp = G.state.player.maxHp')
    force_random(page, 0.99)
    click_choice(page, '质问它')
    restore_random(page)
    page.locator('#choices .choice-btn', has_text='应战').click()
    page.wait_for_timeout(600)
    check(ev(page, '!!Combat.C'), '质问成功后开战（影之先驱）')
    check(ev(page, 'Combat.C.enemies.some(e => e.base === "herald")'), '敌群含影之先驱')
    check(ev(page, 'Combat.C.enemies.find(e => e.base === "herald").statuses.vuln === 2'), '先驱迟疑：开战带 2 层易伤')
    check(ev(page, 'Combat.C.enemies.find(e => e.base === "herald").maxHp - Combat.C.enemies.find(e => e.base === "herald").hp === 15'),
          '先驱迟疑：开战先失 15 点生命')
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1300)
    page.locator('#btn-skip-reward').click()
    page.wait_for_timeout(500)
    page.evaluate('dismissBlessings()')
    check(ev(page, 'G.state.scene') == 'herald_win', '先驱溃散过场')
    check(ev(page, 'G.state.flags.heraldDown') == True, '先驱已倒标记写入')
    check(ev(page, 'G.state.relics.includes("ember_heart")'), '先驱溃散凝出遗物·烬心炉')
    check(ev(page, 'G.state.journal.quests.find(q => q.id === "main_rift").status') == 'done', '裂谷主线已完成')
    check(ev(page, 'Achieve.has("herald_slain")'), '成就「门前的先驱」解锁')
    click_choice(page, '直抵塔下营地')
    check(ev(page, 'G.state.scene') == 'tower_gate', '谷道直通塔下营地（神秘旅人）')
    page.screenshot(path=os.path.join(SHOT, '62_tower_gate.png'))

    # ---- 先驱战后：枢纽不再显示下行与退路 ----
    goto_scene(page, 'rift_gate')
    opts = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('沿先驱让开的谷道前行' in t for t in opts), '先驱战后：枢纽显示直通塔下营地')
    check(not any('迎着塔影下行' in t for t in opts), '先驱战后：不再显示「迎着塔影下行」')
    check(not any('退回矿坑入口' in t for t in opts), '先驱战后：退路已被雾墙封死')

    # ================= 6. 裂谷向成就 =================
    print('== 裂谷向成就 ==')
    check(ev(page, 'Achieve.has("rift_explore5")'), '成就「星痕采集者」解锁（探索计数 ≥5）')
    check(ev(page, 'Achieve.has("rift_all")'), '成就「坠星的注脚」解锁（六则异闻全探）')
    check(ev(page, '!Codex.has("enemies", "shard_hound")'), '被放弃的遭遇战不误录图鉴（星屑猎犬）')
    check(ev(page, 'Codex.has("enemies", "ember_wisp")'), '先驱战群落的余烬之灵已录入图鉴')

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
print('✓ 坠星裂谷测试全部通过')
