# -*- coding: utf-8 -*-
"""星坠之谜 · 矿坑异闻测试：侧巷调度路由与一次性事件 / 六则异闻的检定收益与代价 /
新遗物钩子（击杀回复 / 每回合抽牌 / 开场虚弱 / 易伤增幅）/ 新药剂战斗使用 /
新卡牌淬炼 / 新敌人收录 / 新成就"""
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

def force_random(page, val):
    """固定 Math.random 用于检定：0.99 → 骰 20 必成功；0 → 骰 1 必失败"""
    page.evaluate('window.__origRandom = Math.random; Math.random = function(){ return %s; }' % val)

def restore_random(page):
    page.evaluate('Math.random = window.__origRandom')

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

    # ================= 1. 矿坑异闻：调度与一次性 =================
    print('== 调度与一次性 ==')
    goto_scene(page, 'mine_depths')
    check(any('搜寻侧巷' in t for t in page.locator('#choices .choice-btn').all_inner_texts()),
          '矿坑一层出现「搜寻侧巷与旧工棚」选项')
    check(ev(page, 'DATA.MINE_EVENTS.length') == 6, '矿坑异闻共 6 则')

    seen = []
    for i in range(7):
        goto_scene(page, 'mine_explore')
        seen.append(ev(page, 'G.state.scene'))
    check(set(seen[:6]) == set(ev(page, 'DATA.MINE_EVENTS')), '前六次搜寻覆盖全部 6 则异闻（%s）' % seen[:6])
    check(seen[6] == 'mine_explore_empty', '六则全部触发后落入「侧巷搜遍」场景')
    check(ev(page, 'G.state.stats.explored') == 7, '探索计数 7（%d）' % ev(page, 'G.state.stats.explored'))
    check(ev(page, 'Achieve.has("explore_5")'), '成就「异闻采集者」解锁（≥5 则）')
    page.screenshot(path=os.path.join(SHOT, '55_explore_empty.png'))

    # ================= 2. 六则异闻：检定收益与代价 =================
    print('== 异闻检定 ==')
    goto_scene(page, 'mine_depths')

    # 倾覆的矿车：力量失败 → 伤脚但捡到碎矿
    force_random(page, 0)
    goto_scene(page, 'me_cart')
    gold0, hp0 = ev(page, 'G.state.player.gold'), ev(page, 'G.state.player.hp')
    click_choice(page, '撬开车斗')
    restore_random(page)
    check(ev(page, 'G.state.player.hp') == hp0 - 6 and ev(page, 'G.state.player.gold') == gold0 + 18,
          '矿车力量检定失败：-6 生命、捡回 18 金币')

    # 星尘苔壁：敏捷成功 → 琥珀坠饰
    force_random(page, 0.99)
    goto_scene(page, 'me_moss')
    click_choice(page, '小心剥开苔层')
    restore_random(page)
    check(ev(page, 'hasRelic(G.state, "amber_charm")'), '苔壁敏捷成功：获得遗物【琥珀坠饰】')
    # 苔壁失败分支：苔粉辣眼
    force_random(page, 0)
    goto_scene(page, 'me_moss')
    hp0 = ev(page, 'G.state.player.hp')
    click_choice(page, '小心剥开苔层')
    restore_random(page)
    check(ev(page, 'G.state.player.hp') == hp0 - 5, '苔壁敏捷失败：-5 生命')

    # 巷道尽头的矿灯：魅力成功 → 回响晶簇
    force_random(page, 0.99)
    goto_scene(page, 'me_ghost')
    click_choice(page, '用镐柄回敲')
    restore_random(page)
    check(ev(page, 'hasRelic(G.state, "echo_crystal")'), '矿灯魅力成功：获得遗物【回响晶簇】')
    # 矿灯失败分支：惊动空壳矿工
    force_random(page, 0)
    goto_scene(page, 'me_ghost')
    click_choice(page, '用镐柄回敲')
    restore_random(page)
    page.locator('#choices .choice-btn', has_text='应战').click()
    page.wait_for_timeout(600)
    check(ev(page, '!!Combat.C') and ev(page, 'Combat.C.enemies[0].base') == 'husk', '矿灯检定失败：空壳矿工现身')
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(200)
    goto_scene(page, 'mine_depths')

    # 塌落的窄道：力量成功 → 蛮力药水 + 金币
    force_random(page, 0.99)
    goto_scene(page, 'me_collapse')
    click_choice(page, '撬松另半边')
    restore_random(page)
    check(ev(page, '(G.state.items.rage_draught || 0) >= 1'), '窄道力量成功：获得蛮力药水')

    # 空壳的工棚：敏捷成功 → 雾露指环
    force_random(page, 0.99)
    goto_scene(page, 'me_husk_hut')
    click_choice(page, '憋住呼吸')
    restore_random(page)
    check(ev(page, 'hasRelic(G.state, "dew_ring")'), '工棚敏捷成功：获得遗物【雾露指环】')

    # 暗泉：敏捷失败 → 诅咒【星蚀之痒】
    page.evaluate('G.state.player.hp = G.state.player.maxHp')
    force_random(page, 0)
    goto_scene(page, 'me_pool')
    click_choice(page, '摸进泉底')
    restore_random(page)
    check(ev(page, 'G.state.deck.includes("star_itch")'), '暗泉敏捷失败：诅咒【星蚀之痒】混入牌组')
    page.screenshot(path=os.path.join(SHOT, '56_pool_curse.png'))

    # ================= 3. 泉水净化暗泉的诅咒 =================
    print('== 净化暗泉诅咒 ==')
    page.evaluate('G.state.player.gold = 100')
    goto_scene(page, 'mine_entrance')
    click_choice(page, '洗净一张诅咒卡')
    check(modal_title(page) == '泉眼净化', '净化弹窗打开: ' + modal_title(page))
    card = page.locator('.deck-card.forgetable', has_text='星蚀之痒').first
    card.click(); page.wait_for_timeout(250)
    card.click(); page.wait_for_timeout(400)
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    check(not ev(page, 'G.state.deck.includes("star_itch")'), '暗泉带来的诅咒被泉水洗净')
    check(ev(page, 'G.state.stats.purified') == 1, '净化计数 +1')

    # ================= 4. 新遗物钩子 =================
    print('== 新遗物钩子 ==')
    page.evaluate('G.state.relics = ["amber_charm", "echo_crystal", "dew_ring", "rusted_goad"]')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(600)
    check(ev(page, 'Combat.C.enemies[0].statuses.weak') == 1, '雾露指环：战斗开始全体敌人 1 层虚弱')
    check(ev(page, 'Combat.C.hand.length') == 6, '回响晶簇：首回合抽 6 张（5+1）')
    page.screenshot(path=os.path.join(SHOT, '57_relic_hooks_combat.png'))

    # 锈刺赶棒：致命标记 2 层易伤 → 实际 3 层
    page.evaluate('Combat.C.hand = ["dead_mark"]; Combat.renderAll()')
    page.locator('#hand .card[data-card-idx="0"]').click()
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.enemies[0].statuses.vuln') == 3, '锈刺赶棒：易伤施加 2→3 层')

    # 琥珀坠饰：击杀回复 3 点生命
    page.evaluate('G.state.player.hp = G.state.player.maxHp - 10')
    page.evaluate('Combat.C.enemies[0].hp = 1; Combat.C.hand = ["strike"]; Combat.renderAll()')
    page.locator('#hand .card[data-card-idx="0"]').click()
    page.wait_for_timeout(1400)
    check(ev(page, 'G.state.player.hp') == ev(page, 'G.state.player.maxHp - 7'),
          '琥珀坠饰：击杀敌人回复 3 点生命（%d / %d-7）' % (ev(page, 'G.state.player.hp'), ev(page, 'G.state.player.maxHp')))
    check(ev(page, '!!Combat.C && Combat.C.over'), '击杀后照常进入胜利结算')
    page.locator('#btn-skip-reward').click()
    page.wait_for_timeout(300)

    # ================= 5. 新药剂（战斗使用） =================
    print('== 新药剂 ==')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(600)
    page.evaluate('G.state.items.stone_draught = 1; G.state.items.rage_draught = 1; Combat.renderAll()')
    page.locator('[data-itembtn="stone_draught"]').click()
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.player.block') == 12, '岩肤药水：战斗中获得 12 点护甲')
    page.locator('[data-itembtn="rage_draught"]').click()
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.player.statuses.strength') == 2, '蛮力药水：战斗中获得 2 层力量')
    check(ev(page, 'useItemOutside(G.state, "stone_draught")') == False, '岩肤药水为战斗限定，面板不可用')
    page.evaluate('Combat.abandon()')
    page.wait_for_timeout(200)

    # ================= 6. 新卡牌与淬炼 =================
    print('== 新卡牌 ==')
    check(all(ev(page, '!!DATA.CARDS["%s"]' % cid) for cid in
              ['shield_bash', 'fire_lance', 'herbal_shot', 'scatter_shot', 'second_wind', 'starlight']),
          '6 张新基础卡牌就位')
    check(all(ev(page, '!!DATA.CARDS["%s_up"]' % cid) for cid in
              ['shield_bash', 'fire_lance', 'herbal_shot', 'scatter_shot', 'second_wind', 'starlight']),
          '6 张新卡牌均可淬炼（+_形态就位）')
    page.evaluate('G.state.deck.push("shield_bash"); G.state.player.gold = 200')
    goto_scene(page, 'smith')
    click_choice(page, '淬炼卡牌')
    card = page.locator('.deck-card.forgetable', has_text='盾击').first
    card.click(); page.wait_for_timeout(250)
    card.click(); page.wait_for_timeout(400)
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)
    check(ev(page, 'G.state.deck.includes("shield_bash_up")'), '盾击被淬炼为盾击+')

    # ================= 7. 新敌人与收录 =================
    print('== 新敌人 ==')
    page.evaluate('Combat.start("husk_ghost", "town")')
    page.wait_for_timeout(600)
    check(ev(page, 'Combat.C.enemies[0].name') == '空壳矿工', '敌群 husk_ghost：空壳矿工参战')
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1300)
    check(ev(page, 'Codex.has("enemies", "husk")'), '击败空壳矿工 → 图鉴收录')
    page.locator('#btn-skip-reward').click()
    page.wait_for_timeout(300)
    check(ev(page, 'DATA.ENCOUNTERS.mine.includes("husks") && DATA.ENCOUNTERS.mine.includes("moss_golem") && DATA.ENCOUNTERS.mine.includes("shade_husk")'),
          '矿坑随机遭遇池纳入三组新敌群')
    check(ev(page, 'DATA.ENDLESS_TIERS[3].groups.includes("husks") && DATA.ENDLESS_TIERS[3].groups.includes("shade_husk")'),
          '回廊深层纳入新敌群')

    # ================= 8. 新成就 =================
    print('== 新成就 ==')
    page.evaluate('''
      G.state.relics = ["amber_charm", "echo_crystal", "dew_ring", "rusted_goad",
                        "silver_tongue", "star_pouch", "thorn_ring", "worm_eye"];
      Achieve.check(G.state);
    ''')
    check(ev(page, 'Achieve.has("relic_8")'), '成就「星尘满囊」解锁（同时持有 8 件遗物）')
    page.evaluate('''
      Object.keys(DATA.ENEMIES).slice(0, 15).forEach(id => Codex.mark("enemies", [id]));
      Achieve.check(G.state);
    ''')
    check(ev(page, 'Achieve.has("codex_enemies_15")'), '成就「雾中百景·贰」解锁（收录 15 种敌人）')
    check(ev(page, 'Object.keys(DATA.ACHIEVEMENTS).length') == 35, '成就总数 35')
    check(ev(page, 'DATA.ACHIEVEMENTS.codex_relics.desc.indexOf("17") >= 0'), '「星尘全图」描述随遗物总数动态更新')

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
print('✓ 矿坑异闻测试全部通过')
