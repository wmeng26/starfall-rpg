# -*- coding: utf-8 -*-
"""星坠之谜 · 冒险图鉴测试：图鉴弹窗三栏 / 收录钩子（存档+战斗胜利）/ 跨周目持久 / 图鉴向成就"""
import sys, io, os, json
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

def screenshot(page, name):
    page.screenshot(path=os.path.join(SHOT, name))

def modal_title(page):
    return page.locator('.modal-box .modal-title').last.inner_text().replace(' ', '')

def modal_body(page):
    return page.locator('.modal-box .modal-body').last.inner_text()

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

    total = page.evaluate('Codex.total()')
    check(total == page.evaluate('Object.keys(DATA.CARDS).length + Object.keys(DATA.RELICS).length + Object.keys(DATA.ENEMIES).length'),
          '图鉴总数 = 卡牌+遗物+敌人（%d）' % total)
    check(page.evaluate('Codex.count()') == 0, '初始收录为 0')

    # ---- 标题画面入口 ----
    btn = page.locator('#t-codex')
    check(btn.count() == 1, '标题画面有图鉴按钮')
    check(('（0/%d）' % total) in btn.inner_text(), '按钮显示 0/%d' % total)
    btn.click()
    page.wait_for_timeout(300)
    check(modal_title(page) == '冒险图鉴', '图鉴弹窗打开: ' + modal_title(page))
    check(page.locator('#codex-tabs .codex-tab').count() == 3, '三个分栏标签')
    body = modal_body(page)
    check('？？？' in body and '获得这张牌后收录' in body, '未收录卡牌以 ？？？ 显示')
    check('已收录 0 / %d' % total in modal_body(page) + page.locator('#codex-foot').inner_text(),
          '底部计数 0/%d' % total)
    screenshot(page, '10_codex_cards_locked.png')

    # ---- 分栏切换 ----
    page.locator('#codex-tabs .codex-tab', has_text='遗物').click()
    page.wait_for_timeout(200)
    check('获得这件星尘遗物后收录' in modal_body(page), '遗物栏未收录提示')
    page.locator('#codex-tabs .codex-tab', has_text='敌人').click()
    page.wait_for_timeout(200)
    check('击败它之后收录' in modal_body(page), '敌人栏未收录提示')
    check(page.locator('#codex-body .journal-item').count() == page.evaluate('Object.keys(DATA.ENEMIES).length'),
          '敌人栏条目数与数据一致')
    screenshot(page, '11_codex_enemies_locked.png')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)

    # ---- 手动收录 + 跨周目持久 ----
    page.evaluate('Codex.mark("cards", ["strike", "meteor", "mist_pact"])')
    page.evaluate('Codex.mark("relics", ["watch"])')
    page.evaluate('Codex.mark("enemies", ["goblin", "goblin"])')  # 重复收录应去重
    check(page.evaluate('Codex.count("cards")') == 3 and page.evaluate('Codex.count("enemies")') == 1,
          '手动收录与去重正确')
    check(json.loads(page.evaluate('localStorage.getItem("starfall_rpg_codex_v1")'))['cards'] == ['strike', 'meteor', 'mist_pact'],
          '图鉴写入 localStorage')
    page.reload()
    page.wait_for_timeout(600)
    check(page.evaluate('Codex.count()') == 5, '刷新后图鉴保留（跨会话持久）')
    check(('（5/%d）' % total) in page.locator('#t-codex').inner_text(), '标题按钮计数更新为 5/%d' % total)

    # ---- 实战收录：新游戏 → 战胜哥布林 ----
    page.click('#t-new')
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    page.locator('#choices .choice-btn', has_text='战士').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    page.locator('#choices .choice-btn', has_text='磨砺').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    page.locator('#choices .choice-btn', has_text='迎战').click()
    page.wait_for_timeout(600)
    check(page.locator('#view-combat').is_visible(), '教学战斗开始')
    cards_in_codex_before = page.evaluate('Codex.count("cards")')
    check(cards_in_codex_before == 6, '新游戏存档后初始牌组 6 种卡牌收录（当前 %d）' % cards_in_codex_before)

    # 直接击杀结算胜利
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1200)
    check(page.locator('.reward-card').count() > 0 or page.locator('#btn-skip-reward').count() > 0, '战斗胜利奖励界面')
    check(page.evaluate('Codex.has("enemies", "goblin")'), '战斗胜利收录敌人「哥布林斥候」')
    page.locator('.reward-card').first.click()
    page.wait_for_timeout(500)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    check(page.locator('#view-story').is_visible(), '返回剧情')
    last_card = page.evaluate('G.state.deck[G.state.deck.length - 1]')
    check(page.evaluate('Codex.has("cards", "%s")' % last_card),
          '奖励卡牌【%s】随存档自动收录' % last_card)

    # ---- 菜单入口 ----
    page.click('#btn-menu')
    page.wait_for_timeout(300)
    page.click('#m-codex')
    page.wait_for_timeout(300)
    check(modal_title(page) == '冒险图鉴', '菜单中打开图鉴')
    check('打击' in modal_body(page) and '？？？' in modal_body(page), '卡牌栏混合已收录与未收录')
    screenshot(page, '12_codex_ingame.png')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)

    # ---- 牌组弹窗入口 ----
    page.click('#btn-deck')
    page.wait_for_timeout(300)
    check(page.locator('#btn-codex').count() == 1, '牌组弹窗有「查看全图鉴」按钮')
    page.click('#btn-codex')
    page.wait_for_timeout(300)
    check(modal_title(page) == '冒险图鉴', '从牌组弹窗进入图鉴')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)

    # ---- 图鉴向成就 ----
    page.evaluate('''
      Object.keys(DATA.ENEMIES).forEach(id => Codex.mark("enemies", [id]));
      Object.keys(DATA.RELICS).forEach(id => Codex.mark("relics", [id]));
      Object.keys(DATA.CARDS).forEach(id => Codex.mark("cards", [id]));
      Achieve.check(G.state);
    ''')
    check(page.evaluate('Achieve.has("codex_enemies")'), '成就「雾中百景」解锁（收录 10 种敌人）')
    check(page.evaluate('Achieve.has("codex_relics")'), '成就「星尘全图」解锁（集齐 13 遗物）')
    check(page.evaluate('Achieve.has("codex_cards")'), '成就「阅牌无数」解锁（收录 20 种卡牌）')
    unlocked = page.evaluate('Codex.count()')
    check(unlocked == total, '全量收录后计数 = 总数（%d/%d）' % (unlocked, total))

    # ---- 全收录后的展示 ----
    page.click('#t-codex') if page.locator('#view-title').is_visible() else None
    if not page.locator('.modal-box').count():
        page.click('#btn-menu'); page.wait_for_timeout(200); page.click('#m-codex'); page.wait_for_timeout(300)
    page.locator('#codex-tabs .codex-tab', has_text='敌人').click()
    page.wait_for_timeout(200)
    check('？？？' not in modal_body(page), '全收录后敌人栏无 ？？？')
    check('哥布林斥候' in modal_body(page) and '头目' in modal_body(page), '敌人栏显示名称与头目标记')
    screenshot(page, '13_codex_complete.png')

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
        print('  - ' + e)
    sys.exit(1)
print('✓ 冒险图鉴测试全部通过')
