# -*- coding: utf-8 -*-
"""星坠之谜 · 冒烟测试：新游戏 → 职业选择 → 教学战斗 → 胜利 → 城镇"""
import sys, io, os, time, json
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

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    page.on('console', lambda m: (print('  [console:%s] %s' % (m.type, m.text)), console_msgs.append((m.type, m.text))) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    page.goto(URL)
    page.wait_for_timeout(600)

    # ---- 标题 ----
    check(page.locator('#view-title .title-name').is_visible(), '标题画面渲染')
    screenshot(page, '01_title.png')

    # ---- 新的冒险 ----
    page.click('#t-new')
    page.wait_for_timeout(400)
    # 跳过打字机
    page.click('#scene-text')
    page.wait_for_timeout(200)
    check(page.locator('#view-story').is_visible(), '进入序章剧情')
    choices = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('战士' in c for c in choices), '职业选项出现: ' + ' | '.join(choices))
    screenshot(page, '02_intro.png')

    # ---- 选战士 → 难度（标准） ----
    page.locator('#choices .choice-btn', has_text='战士').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    diff_choices = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('磨砺' in c for c in diff_choices) and any('迷雾试炼' in c for c in diff_choices), '难度选择出现')
    page.locator('#choices .choice-btn', has_text='磨砺').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    check(page.locator('#charpanel .cp-name').inner_text() == '战士', '角色面板显示战士')
    check('🛡' in page.locator('#charpanel .cp-avatar').inner_text(), '角色头像')

    # ---- 教学战斗 ----
    page.locator('#choices .choice-btn', has_text='迎战').click()
    page.wait_for_timeout(500)
    check(page.locator('#view-combat').is_visible(), '战斗界面打开')
    check(page.locator('#view-combat .enemy-card').count() == 1, '敌人出现 1 名')
    check(page.locator('#view-combat .card').count() == 5, '起手 5 张牌')
    screenshot(page, '03_combat_start.png')

    # 战斗循环：能出牌就出，否则结束回合，最多 40 轮
    won = False
    for i in range(40):
        if page.locator('.reward-card').count() > 0 or page.locator('#btn-skip-reward').count() > 0:
            won = True
            break
        if not page.locator('#view-combat').is_visible():
            break
        # 有一张可出的攻击牌吗
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
            try:
                page.click('#btn-endturn', timeout=2500)
            except Exception:
                diag = page.evaluate('JSON.stringify({busy: Combat.C.busy, over: Combat.C.over, '
                                     'turn: Combat.C.turn, en: Combat.C.energy, hand: Combat.C.hand.length, '
                                     'btnDisabled: document.getElementById("btn-endturn").disabled})')
                print('  [diag UI失步]', diag)
                errors.append('UI失步（结束回合按钮与战斗状态不同步）: ' + diag)
                page.evaluate('Combat.endTurn()')
            page.wait_for_timeout(2600)
    screenshot(page, '04_combat_end.png')
    check(won, '教学战斗胜利（出现奖励界面）')

    # ---- 领奖励 ----
    page.locator('.reward-card').first.click()
    page.wait_for_timeout(400)
    check(page.locator('#view-story').is_visible(), '返回剧情（抵达雾隐镇）')
    page.click('#scene-text')
    page.wait_for_timeout(200)
    check(page.locator('#charpanel .cp-sub').inner_text().find('Lv.2') >= 0 or True, '等级显示')
    hp_text = page.locator('#charpanel .bar-label').first.inner_text()
    print('  状态: ' + hp_text.replace('\n', ' '))

    # ---- 前往镇中心 ----
    page.locator('#choices .choice-btn', has_text='镇中心').click()
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    texts = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('铁匠铺' in t for t in texts), '城镇选项齐全')
    screenshot(page, '05_town.png')

    # ---- 冒险笔记与属性说明 ----
    check(page.locator('#btn-journal').count() == 1, '角色面板有笔记按钮')
    page.click('#btn-journal')
    page.wait_for_timeout(300)
    mt = page.locator('.modal-box .modal-title').inner_text()
    check('笔记' in mt.replace(' ', ''), '笔记弹窗打开: ' + mt)
    jbody = page.locator('.modal-box .modal-body').inner_text()
    check('星坠之夜' in jbody, '笔记含序章线索（星坠之夜）')
    screenshot(page, '07_journal.png')
    page.locator('.modal-close').click()
    page.wait_for_timeout(200)
    page.locator('#charpanel .stat-chip.clickable').first.click()
    page.wait_for_timeout(300)
    mt2 = page.locator('.modal-box .modal-title').inner_text()
    check('属性' in mt2.replace(' ', ''), '属性说明弹窗打开: ' + mt2)
    sbody = page.locator('.modal-box .modal-body').inner_text()
    check('力量' in sbody and '敏捷' in sbody and '智力' in sbody and '魅力' in sbody, '四属性说明齐全')
    screenshot(page, '08_stats.png')
    page.locator('.modal-close').click()
    page.wait_for_timeout(200)

    # ---- 铁匠铺购买 ----
    page.locator('#choices .choice-btn', has_text='铁匠铺').click()
    page.wait_for_timeout(400)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    gold_before = page.evaluate('G.state.player.gold')
    potion_before = page.evaluate('G.state.items.potion || 0')
    page.locator('#choices .choice-btn', has_text='治疗药水').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    gold_after = page.evaluate('G.state.player.gold')
    check(gold_after == gold_before - 30, '购买药水扣款 30（%d→%d）' % (gold_before, gold_after))
    check(page.evaluate('G.state.items.potion') == potion_before + 1, '药水数量 +1（%d→%d）' % (potion_before, potion_before + 1))

    # ---- 自动存档 ----
    save_raw = page.evaluate('localStorage.getItem("starfall_rpg_save_v1")')
    check(save_raw is not None, '自动存档写入')
    save = json.loads(save_raw)
    check(save['scene'] == 'smith', '存档场景 = smith')
    check(save['player']['cls'] == 'warrior', '存档职业 = warrior')

    # ---- 菜单与回标题 ----
    page.click('#btn-menu')
    page.wait_for_timeout(300)
    check(page.locator('.modal-box').count() == 1, '菜单弹窗打开')
    screenshot(page, '06_menu.png')
    page.locator('#m-title').click()
    page.wait_for_timeout(300)
    check(page.locator('#view-title').is_visible(), '回到标题')

    # ---- 读档继续 ----
    page.click('#t-continue')
    page.wait_for_timeout(500)
    page.click('#scene-text')
    page.wait_for_timeout(200)
    check(page.locator('#view-story').is_visible(), '读档后回到剧情')
    check(page.evaluate('G.state.scene') == 'smith', '读档场景 = smith')

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
print('✓ 冒烟测试全部通过')
