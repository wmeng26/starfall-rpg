# -*- coding: utf-8 -*-
"""星坠之谜 · 升级祝福测试：升级攒祝福 / 场景跳转拦截 / 三择一结算 /
涌泉行动力加成与一次性排除 / 顿悟随机卡 / 连续多道祝福 / 结局不拦截 / 成就"""
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

def click_choice(page, text):
    page.locator('#choices .choice-btn', has_text=text).first.click()
    page.wait_for_timeout(400)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)

def fix_picks(page, ids):
    """进入祝福场景后覆写三候选并重渲染，保证断言确定性"""
    page.evaluate('G.state.flags.blessPicks = %s; Story.renderChoices(DATA.SCENES.blessing)' % ids)
    page.wait_for_timeout(200)

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

    # ================= 1. 升级攒祝福 + 场景拦截 =================
    print('== 拦截与三择一 ==')
    page.evaluate('gainXp(G.state, 60)')
    check(ev(page, 'G.state.player.level') == 2, 'gainXp 60 → Lv.2')
    check(ev(page, 'G.state.flags.pendingBless') == 1, '升级攒下 1 道待择祝福')
    goto_scene(page, 'town')
    check(ev(page, 'G.state.scene') == 'blessing', '跳转被拦截至祝福场景')
    n_choices = page.locator('#choices .choice-btn').count()
    check(n_choices == 4, '祝福场景有 3 道候选 + 1 个放弃（%d）' % n_choices)
    check(ev(page, 'G.state.flags.pendingBless') == 0, '进入场景即消费一道祝福')
    page.screenshot(path=os.path.join(SHOT, '60_blessing_scene.png'))

    # 坚韧：生命上限 +12
    mx = ev(page, 'G.state.player.maxHp')
    fix_picks(page, ['bless_vigor', 'bless_pow', 'bless_int'])
    click_choice(page, '坚韧')
    check(ev(page, 'G.state.player.maxHp') == mx + 12, '坚韧：生命上限 +12（%d→%d）' % (mx, ev(page, 'G.state.player.maxHp')))
    check(ev(page, 'G.state.scene') == 'town', '择毕回到被拦截前的目的地（镇中心）')
    check(ev(page, 'G.state.stats.blessings') == 1, '祝福择取计数 +1')

    # ================= 2. 涌泉：行动力上限 +1（每局一次） =================
    print('== 涌泉 ==')
    page.evaluate('G.state.flags.pendingBless = 1')
    goto_scene(page, 'town')
    check(ev(page, 'G.state.scene') == 'blessing', '再次拦截')
    fix_picks(page, ['bless_energy', 'bless_gold', 'bless_heal'])
    click_choice(page, '涌泉')
    check(ev(page, 'G.state.flags.energyBonus') == True, '涌泉落旗 energyBonus')
    check(ev(page, 'G.state.scene') == 'town', '择毕回到镇中心')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(600)
    check(ev(page, 'Combat.C.maxEnergy') == 4, '涌泉：战斗行动力上限 3→4')
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(200)

    # 已择涌泉 → 不再进入候选
    page.evaluate('G.state.flags.pendingBless = 1')
    goto_scene(page, 'blessing')
    check(not any('涌泉' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '已择涌泉后从候选池排除')

    # ================= 3. 顿悟 / 横财 / 安眠 =================
    print('== 其余祝福 ==')
    deck0 = ev(page, 'G.state.deck.length')
    fix_picks(page, ['bless_card', 'bless_gold', 'bless_heal'])
    click_choice(page, '顿悟')
    check(ev(page, 'G.state.deck.length') == deck0 + 1, '顿悟：牌组 +1 张随机卡')
    new_card = ev(page, 'G.state.deck[G.state.deck.length - 1]')
    check(ev(page, '!DATA.CARDS["%s"].up && ["common","rare"].includes(DATA.CARDS["%s"].rarity)' % (new_card, new_card)),
          '顿悟发放普通/稀有卡（%s）' % new_card)
    goto_scene(page, 'town')

    page.evaluate('G.state.flags.pendingBless = 1; G.state.player.hp = 10')
    gold0 = ev(page, 'G.state.player.gold')
    goto_scene(page, 'town')   # 拦截
    fix_picks(page, ['bless_gold', 'bless_heal', 'bless_pow'])
    click_choice(page, '横财')
    check(ev(page, 'G.state.player.gold') == gold0 + 80, '横财：+80 金币')
    check(ev(page, 'G.state.player.hp') == 10, '未择安眠，生命不变（仍处于被拦截前 HP）')

    page.evaluate('G.state.flags.pendingBless = 1')
    goto_scene(page, 'town')
    fix_picks(page, ['bless_heal', 'bless_vigor', 'bless_int'])
    click_choice(page, '安眠')
    check(ev(page, 'G.state.player.hp') == ev(page, 'G.state.player.maxHp'), '安眠：完全恢复生命')

    # ================= 4. 连续多道祝福 + 放弃 =================
    print('== 连续祝福 ==')
    page.evaluate('G.state.flags.pendingBless = 2')
    goto_scene(page, 'town')
    check(ev(page, 'G.state.scene') == 'blessing', '两道祝福 → 拦截')
    fix_picks(page, ['bless_pow', 'bless_agi', 'bless_int'])
    click_choice(page, '蛮力')
    check(ev(page, 'G.state.scene') == 'blessing', '第一道择毕立即拦截第二道')
    check(ev(page, 'G.state.player.stats.pow') == 4, '蛮力：力量 +1（3→4）')
    fix_picks(page, ['bless_agi', 'bless_int', 'bless_cha'])
    click_choice(page, '灵巧')
    check(ev(page, 'G.state.scene') == 'town', '第二道择毕回到镇中心')
    check(ev(page, 'G.state.stats.blessings') == 7, '累计择取 7 道祝福')
    check(ev(page, 'Achieve.has("bless_3")'), '成就「受祝之人」解锁（≥3 道）')

    # 放弃：不计数，待择清零
    page.evaluate('G.state.flags.pendingBless = 1')
    goto_scene(page, 'town')
    n0 = ev(page, 'G.state.stats.blessings')
    click_choice(page, '都不要')
    check(ev(page, 'G.state.scene') == 'town' and ev(page, 'G.state.stats.blessings') == n0,
          '放弃祝福：不计数，直接前行')
    check(ev(page, 'G.state.flags.pendingBless') == 0, '放弃后待择清零')

    # ================= 5. 结局不拦截 =================
    print('== 结局豁免 ==')
    page.evaluate('G.state.flags.pendingBless = 1')
    goto_scene(page, 'ending_peace')
    check(ev(page, 'G.state.scene') == 'ending_peace', '结局场景不被祝福拦截')

    check(ev(page, 'Object.keys(DATA.ACHIEVEMENTS).length') == 36, '成就总数 36')

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
print('✓ 升级祝福测试全部通过')
