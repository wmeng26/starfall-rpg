# -*- coding: utf-8 -*-
"""星坠之谜 · 淬炼与诅咒测试：铁匠铺淬炼 / 无面神龛 / 诅咒入牌组与不可打出 /
回合末代价 / 泉水净化 / 图鉴口径 / 成就"""
import sys, io, os, math
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file:///' + os.path.join(ROOT, 'index.html').replace('\\', '/')
SHOT = os.path.join(ROOT, 'tools', 'shots')
os.makedirs(SHOT, exist_ok=True)

errors = []
console_msgs = []

def js_round(x):
    """JS Math.round：正数 .5 向上取（Python round 是银行家舍入）"""
    return math.floor(x + 0.5)

def check(cond, msg):
    if cond:
        print('  OK ' + msg)
    else:
        print('  FAIL ' + msg)
        errors.append(msg)

def ev(page, expr):
    return page.evaluate(expr)

def modal_title(page):
    return page.locator('.modal-box .modal-title').last.inner_text().replace(' ', '')

def modal_body(page):
    return page.locator('.modal-box .modal-body').last.inner_text()

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

def pick_deck_card(page, name, twice=True):
    card = page.locator('.deck-card.forgetable', has_text=name).first
    card.click()
    page.wait_for_timeout(250)
    if twice:
        card.click()
        page.wait_for_timeout(400)

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
    check(ev(page, 'G.state.scene') == 'arrival', '教学战斗后抵达雾隐镇')

    # ================= 1. 铁匠铺淬炼 =================
    print('== 铁匠铺淬炼 ==')
    goto_scene(page, 'smith')
    check(any('淬炼卡牌' in t for t in page.locator('#choices .choice-btn').all_inner_texts()), '铁匠铺出现淬炼选项')
    page.evaluate('G.state.player.gold = 200')
    goto_scene(page, 'smith')
    click_choice(page, '淬炼卡牌')
    check(modal_title(page) == '淬炼炉火', '淬炼弹窗打开: ' + modal_title(page))
    page.screenshot(path=os.path.join(SHOT, '50_forge_modal.png'))
    pick_deck_card(page, '打击')
    check(ev(page, 'G.state.deck.includes("strike_up")'), '打击被淬炼为打击+（deck 出现 strike_up）')
    check(ev(page, 'G.state.deck.filter(c => c === "strike").length') == 4, '同名卡每张单独淬炼（打击剩 4 张）')
    check(ev(page, 'G.state.player.gold') == 140, '淬炼扣款 60 金币（200→140）')
    check(ev(page, 'G.state.stats.upgraded') == 1, '淬炼计数 +1')
    check('防御' in modal_body(page), '弹窗重开，可继续淬炼其他卡牌')
    page.screenshot(path=os.path.join(SHOT, '51_forge_done.png'))
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    page.click('#btn-deck')   # 牌组浏览弹窗中应显示淬炼形态
    page.wait_for_timeout(300)
    check('打击+' in modal_body(page), '牌组弹窗显示淬炼形态【打击+】')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    click_choice(page, '淬炼卡牌')          # 铁匠铺淬炼可重复
    pick_deck_card(page, '重斩')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    check(ev(page, 'G.state.deck.includes("heavy_slash_up")') and ev(page, 'G.state.stats.upgraded') == 2,
          '第二次淬炼：重斩→重斩+')

    # ================= 2. 无面神龛 =================
    print('== 无面神龛 ==')
    goto_scene(page, 'mine_depths')
    click_choice(page, '无面神龛')
    check(ev(page, 'G.state.scene') == 'shrine', '抵达无面神龛')
    g0 = ev(page, 'G.state.player.gold')
    click_choice(page, '掳走神龛的供品')
    check(ev(page, 'G.state.player.gold') == g0 + 60, '掳走供品得到 60 金币')
    check(ev(page, 'G.state.deck.includes("graven_sin")'), '神龛的注视：诅咒【盗来的罪疚】混入牌组')
    check('神龛空了' in page.locator('#scene-text').inner_text(), '掳走供品后神龛文本改变')
    page.screenshot(path=os.path.join(SHOT, '52_shrine_plunder.png'))

    # 血祭：-10% 生命上限 + 随机普通/稀有卡
    mx, hp_before, deck_before = ev(page, 'G.state.player.maxHp'), ev(page, 'G.state.player.hp'), ev(page, 'G.state.deck.length')
    click_choice(page, '割掌')
    check(ev(page, 'G.state.player.hp') == hp_before - js_round(mx * 0.10),
          '血祭失去 10%% 生命上限（%d→%d）' % (hp_before, ev(page, 'G.state.player.hp')))
    check(ev(page, 'G.state.deck.length') == deck_before + 1, '血祭换来一张卡牌')
    check(page.evaluate('!DATA.CARDS[DATA.SCENES.shrine.choices.find(c => c.once === "shrine_blood").fxFn(G.state).card].up'),
          '血祭发放的卡牌无淬炼变体')

    # 祝圣：30 金币淬炼一张（一次性）
    page.evaluate('G.state.player.gold = 100')
    goto_scene(page, 'shrine')
    click_choice(page, '献上 30 金币')
    check(modal_title(page) == '淬炼炉火', '神龛祝圣复用淬炼弹窗')
    pick_deck_card(page, '防御')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    check(ev(page, 'G.state.deck.includes("defend_up")'), '祝圣淬炼：防御→防御+')
    check(ev(page, 'G.state.player.gold') == 70, '祝圣只收 30 金币（100→70）')
    check(ev(page, 'G.state.flags.shrine_blessed') == True, '祝圣落旗 shrine_blessed')
    goto_scene(page, 'shrine')
    check(not any('献上' in t for t in page.locator('#choices .choice-btn').all_inner_texts()), '祝圣是一次性的（选项消失）')

    # ================= 3. 诅咒在战斗中 =================
    print('== 诅咒与战斗 ==')
    page.evaluate('G.state.deck.push("whisper_brand", "star_itch")')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(400)
    page.evaluate('Combat.C.hand = ["whisper_brand", "strike"]; Combat.renderAll()')
    page.wait_for_timeout(200)
    page.locator('#hand .card[data-card-idx="0"]').click()
    page.wait_for_timeout(300)
    check(ev(page, 'Combat.C.hand[0]') == 'whisper_brand' and ev(page, 'Combat.C.energy') == 3,
          '诅咒牌无法打出（不消耗行动力）')
    page.locator('#hand .card[data-card-idx="1"]').click()
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.energy') == 2 and ev(page, 'Combat.C.hand.length') == 1,
          '普通卡照常打出（行动力 3→2）')

    # 回合末 drain：星蚀之痒在手 → 失去 1 生命
    hp0 = ev(page, 'G.state.player.hp')
    page.evaluate('Combat.C.player.statuses = {}; Combat.C.hand = ["star_itch"]; Combat.C.enemies[0].intent = { name: "发呆" }')
    page.evaluate('Combat.endTurn()')
    page.wait_for_timeout(1600)
    check(ev(page, 'G.state.player.hp') == hp0 - 1, '回合末手中诅咒索取 1 点生命（%d→%d）' % (hp0, ev(page, 'G.state.player.hp')))
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(100)

    # ================= 4. 泉水净化 =================
    print('== 泉水净化 ==')
    n_curse = ev(page, 'G.state.deck.filter(id => DATA.CARDS[id].curse).length')
    check(n_curse >= 2, '牌组中现有诅咒（%d 张）' % n_curse)
    goto_scene(page, 'mine_entrance')
    check(any('洗净一张诅咒卡' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '矿坑入口出现净化选项（牌组有诅咒）')
    g0 = ev(page, 'G.state.player.gold')
    click_choice(page, '洗净一张诅咒卡')
    check(modal_title(page) == '泉眼净化', '净化弹窗打开: ' + modal_title(page))
    check('盗来的罪疚' in modal_body(page), '净化弹窗只列诅咒牌')
    page.screenshot(path=os.path.join(SHOT, '53_purify_modal.png'))
    pick_deck_card(page, '盗来的罪疚')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    check(not ev(page, 'G.state.deck.includes("graven_sin")'), '诅咒被泉水洗去')
    check(ev(page, 'G.state.player.gold') == g0 - 40, '净化收 40 金币')
    check(ev(page, 'G.state.stats.purified') == 1, '净化计数 +1')
    goto_scene(page, 'mine_entrance')
    check(any('洗净一张诅咒卡' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '仍有诅咒时净化选项保留')

    # ================= 5. 头目战持诅咒 → 成就 =================
    print('== 负罪而行 ==')
    page.evaluate('Combat.start("boss_worm", "town")')
    page.wait_for_timeout(400)
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1300)
    check(ev(page, 'G.state.flags.curseBossWin') == True, '持诅咒头目战胜利 → curseBossWin')
    check(ev(page, 'Achieve.has("curse_boss")'), '成就「负罪而行」解锁')
    page.locator('#btn-skip-reward').click()
    page.wait_for_timeout(300)

    # ================= 6. 吸收星核的代价 =================
    print('== 星核的饥馑 ==')
    goto_scene(page, 'absorb_confirm')
    click_choice(page, '我要亲手终结')
    check(ev(page, 'G.state.deck.includes("core_hunger")'), '吸收星核：诅咒【星核的饥馑】混入牌组')
    check(ev(page, 'G.state.deck.includes("shadow_rage")'), '吸收星核：获得【影之怒】')
    check(ev(page, 'G.state.flags.core') == 'absorb', '吸收路线 core=absorb')

    # ================= 7. 图鉴口径 =================
    print('== 图鉴口径 ==')
    cards0 = ev(page, 'Codex.count("cards")')
    page.evaluate('Codex.mark("cards", ["strike_up", "heavy_slash_up"])')
    check(ev(page, 'Codex.count("cards")') == cards0, '淬炼变体不计入图鉴')
    check(ev(page, 'Codex.has("cards", "whisper_brand")'), '诅咒牌随牌组自动收录进图鉴')
    was_new = ev(page, '!Codex.has("cards", "meteor")')
    page.evaluate('Codex.mark("cards", ["meteor"])')
    check(was_new and ev(page, 'Codex.count("cards")') == cards0 + 1, '普通卡牌照常计入图鉴')
    page.click('#btn-deck')
    page.wait_for_timeout(200)
    page.click('#btn-codex')
    page.wait_for_timeout(300)
    check('诅咒' in modal_body(page) and '低语的烙印' in modal_body(page), '图鉴展示诅咒牌与「诅咒」标签')
    page.screenshot(path=os.path.join(SHOT, '54_codex_curse.png'))
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)

    check(ev(page, 'Object.keys(DATA.ACHIEVEMENTS).length') == 35, '成就总数 35（29 + 淬炼/诅咒 ×3 + 异闻/遗物/图鉴 ×3）')

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
print('✓ 淬炼与诅咒测试全部通过')
