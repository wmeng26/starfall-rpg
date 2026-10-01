# -*- coding: utf-8 -*-
"""星坠之谜 · 移动端适配测试：390×844 竖屏主流程 + SE 尺寸/横屏战斗截图"""
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

def no_h_overflow(page, tag):
    """页面级不允许横向溢出（手牌内部横滑除外）"""
    w = page.evaluate('document.documentElement.scrollWidth')
    iw = page.evaluate('window.innerWidth')
    check(w <= iw + 1, '%s 无页面横向溢出（scrollWidth=%s ≤ %s）' % (tag, w, iw))

def shot(page, name):
    page.screenshot(path=os.path.join(SHOT, name))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    page.on('console', lambda m: console_msgs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    page.goto(URL)
    page.wait_for_timeout(600)
    shot(page, 'm01_title.png')
    no_h_overflow(page, '标题')

    # ---- 新的冒险 → 序章 → 选战士 ----
    page.click('#t-new')
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    page.locator('#choices .choice-btn', has_text='战士').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(100)
    page.locator('#choices .choice-btn', has_text='磨砺').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    shot(page, 'm02_story.png')
    no_h_overflow(page, '剧情')

    # ---- 进入战斗：先在两种额外视口各截一张，再回主视口打完 ----
    page.locator('#choices .choice-btn', has_text='迎战').click()
    page.wait_for_timeout(600)

    # iPhone SE 竖屏（矮屏）
    page.set_viewport_size({'width': 375, 'height': 667})
    page.wait_for_timeout(300)
    shot(page, 'm08_se_combat.png')
    no_h_overflow(page, 'SE战斗')
    vc = page.evaluate('(() => { const e = document.querySelector("#view-combat"); return {sh: e.scrollHeight, ch: e.clientHeight}; })()')
    check(vc['sh'] <= vc['ch'] + 2, 'SE 竖屏战斗一屏放下（%s ≤ %s）' % (vc['sh'], vc['ch']))

    # 手机横屏（矮宽）
    page.set_viewport_size({'width': 844, 'height': 390})
    page.wait_for_timeout(300)
    shot(page, 'm09_landscape_combat.png')
    no_h_overflow(page, '横屏战斗')
    vc = page.evaluate('(() => { const e = document.querySelector("#view-combat"); return {sh: e.scrollHeight, ch: e.clientHeight}; })()')
    check(vc['sh'] <= vc['ch'] + 2, '横屏战斗一屏放下（%s ≤ %s）' % (vc['sh'], vc['ch']))
    # 敌人卡/中栏/手牌三者纵向互不遮挡
    gap = page.evaluate('(() => { const en = document.querySelector(".c-enemies").getBoundingClientRect();'
                        ' const md = document.querySelector(".c-mid").getBoundingClientRect();'
                        ' const hd = document.getElementById("hand").getBoundingClientRect();'
                        ' return {a: md.top - en.bottom, b: hd.top - md.bottom}; })()')
    check(gap['a'] >= -2 and gap['b'] >= -2,
          '横屏 敌人/中栏/手牌 无重叠（中栏上方 %s，手牌上方 %s）' % (round(gap['a'], 1), round(gap['b'], 1)))

    page.set_viewport_size({'width': 390, 'height': 844})
    page.wait_for_timeout(300)

    check(page.locator('#view-combat .card').count() == 5, '起手 5 张牌')
    card_w = page.evaluate('document.querySelector("#view-combat .card").getBoundingClientRect().width')
    check(abs(card_w - 104) < 2, '紧凑卡牌宽度生效（%s px）' % card_w)

    # 手牌应为单行横滑：内容宽 > 容器宽
    hand = page.evaluate('(() => { const h = document.getElementById("hand"); return {sw: h.scrollWidth, cw: h.clientWidth}; })()')
    check(hand['sw'] > hand['cw'], '手牌单行横滑模式（内容 %s > 容器 %s）' % (hand['sw'], hand['cw']))

    # 战斗界面各栏不横向溢出
    for sel, name in [('#view-combat', '战斗视图'), ('.c-mid', '玩家中栏'), ('.c-enemies', '敌人区')]:
        r = page.evaluate('(() => { const e = document.querySelector("%s"); return {sw: e.scrollWidth, cw: e.clientWidth}; })()' % sel)
        check(r['sw'] <= r['cw'] + 1, '%s 无横向溢出（%s ≤ %s）' % (name, r['sw'], r['cw']))

    # 顶栏 🎒 抽屉：打开 → 遮罩 → 点遮罩收回
    check(page.locator('#btn-panel').is_visible(), '顶栏🎒按钮可见')
    page.click('#btn-panel')
    page.wait_for_timeout(400)
    check(page.evaluate('document.body.classList.contains("panel-open")'), '抽屉打开')
    shot(page, 'm06_drawer.png')
    page.mouse.click(390 - 12, 400)  # 点右侧遮罩
    page.wait_for_timeout(400)
    check(not page.evaluate('document.body.classList.contains("panel-open")'), '点遮罩收回抽屉')

    # ---- 战斗循环（同冒烟测试策略）----
    won = False
    for i in range(40):
        if page.locator('#btn-skip-reward').count() > 0 or page.locator('.reward-card').count() > 0:
            won = True
            break
        if not page.locator('#view-combat').is_visible():
            break
        played = False
        for idx in range(page.locator('#view-combat .card').count()):
            card = page.locator('#view-combat .card').nth(idx)
            cls = card.get_attribute('class') or ''
            if 'unaffordable' not in cls and 'type-attack' in cls:
                card.click()
                page.wait_for_timeout(700)
                played = True
                break
        if not played:
            for idx in range(page.locator('#view-combat .card').count()):
                card = page.locator('#view-combat .card').nth(idx)
                cls = card.get_attribute('class') or ''
                if 'unaffordable' not in cls:
                    card.click()
                    page.wait_for_timeout(500)
                    played = True
                    break
        if not played:
            busy = page.evaluate('Combat.C && Combat.C.busy')
            if busy:
                page.wait_for_timeout(800)
                continue
            page.click('#btn-endturn', timeout=2500)
            page.wait_for_timeout(2600)
        if i == 1:
            shot(page, 'm04_combat_mid.png')
    shot(page, 'm05_reward.png')
    check(won, '教学战斗胜利（奖励界面）')
    no_h_overflow(page, '奖励')

    # 结束回合按钮热键提示在窄屏应隐藏
    hint = page.evaluate('(() => { const h = document.querySelector(".kbd-hint"); return h ? getComputedStyle(h).display : "absent"; })()')

    # ---- 领奖 → 镇中心 → 抽屉里开笔记弹窗 ----
    if page.locator('.reward-card').count() > 0:
        page.locator('.reward-card').first.click()
        page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    page.locator('#choices .choice-btn', has_text='镇中心').click()
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    shot(page, 'm07_town.png')
    no_h_overflow(page, '城镇')

    # 抽屉打开状态下点「翻开笔记」→ 弹窗应盖在抽屉之上
    page.click('#btn-panel')
    page.wait_for_timeout(400)
    page.click('#btn-journal')
    page.wait_for_timeout(300)
    mt = page.locator('.modal-box .modal-title').inner_text()
    check('笔记' in mt.replace(' ', ''), '抽屉中打开笔记弹窗: ' + mt)
    shot(page, 'm10_journal_modal.png')
    page.locator('.modal-close').click()
    page.wait_for_timeout(200)

    # 弹窗宽度不超屏
    page.locator('#charpanel .stat-chip.clickable').first.click()
    page.wait_for_timeout(300)
    mb = page.evaluate('(() => { const b = document.querySelector(".modal-box").getBoundingClientRect(); return {w: b.width, right: b.right}; })()')
    check(mb['right'] <= 391, '属性弹窗右缘不出屏（%s）' % mb['right'])
    page.locator('.modal-close').click()
    page.wait_for_timeout(200)
    page.mouse.click(390 - 12, 400)
    page.wait_for_timeout(300)

    # ---- 菜单按钮（窄屏只显示 ☰）----
    ml = page.evaluate('(() => { const l = document.querySelector(".menu-label"); return l ? getComputedStyle(l).display : "absent"; })()')
    page.click('#btn-menu')
    page.wait_for_timeout(300)
    check(page.locator('.modal-box').count() == 1, '菜单弹窗打开')
    shot(page, 'm11_menu.png')
    page.locator('#m-title').click()
    page.wait_for_timeout(300)
    check(page.locator('#view-title').is_visible(), '回到标题')

    print('  [info] kbd-hint display: %s / menu-label display: %s' % (hint, ml))

    browser.close()

print('')
if console_msgs:
    print('浏览器 console 警告/错误:')
    for t, m in console_msgs[:20]:
        print('  [%s] %s' % (t, m))
print('')
if errors:
    print('✗ 移动端测试失败 %d 项:' % len(errors))
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ 移动端测试全部通过')
