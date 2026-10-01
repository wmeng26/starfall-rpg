# -*- coding: utf-8 -*-
"""星坠之谜 · 迷雾回廊（无尽模式）测试：入口解锁 / 门厅流程 / 层数缩放 / 回响头目 / 遗物回礼 / 泉水与休整 / 死亡与纪录"""
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

def scene_text(page):
    page.click('#scene-text')  # 跳过打字机
    page.wait_for_timeout(200)
    return page.locator('#scene-text').inner_text()

def pick(page, text):
    page.locator('#choices .choice-btn', has_text=text).click()
    page.wait_for_timeout(300)

def win_fight(page):
    """直接击杀场上敌人并结算胜利奖励，随后跳过卡牌奖励"""
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1200)
    page.click('#btn-skip-reward')
    page.wait_for_timeout(500)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    page.on('console', lambda m: console_msgs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    # ================= 1. 首次运行：无回廊入口 =================
    page.goto(URL)
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_timeout(600)
    check(page.locator('#t-endless').count() == 0, '未通关时标题无迷雾回廊按钮')

    # ================= 2. 首局速通结局，解锁回廊 =================
    page.click('#t-new')
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '战士')
    scene_text(page)
    pick(page, '磨砺')
    scene_text(page)
    page.evaluate('G.state.flags.core = "pure"; Story.goto("ending_light")')
    scene_text(page)
    pick(page, '回到标题')
    page.wait_for_timeout(300)
    en = page.locator('#t-endless')
    check(en.count() == 1, '通关后标题出现迷雾回廊按钮')
    check('迷 雾 回 廊' in en.inner_text() and '最深 0 层' in en.inner_text(), '按钮显示名称与最深纪录 0 层: ' + en.inner_text())
    screenshot(page, '30_title_endless.png')

    # ================= 3. 回廊开局：职业 → 难度 → 回廊开场 → 门厅 =================
    en.click()
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '法师')
    txt = scene_text(page)
    check('走多险的路' in txt, '回廊开局同样经过难度选择')
    pick(page, '磨砺')
    txt = scene_text(page)
    check('迷雾回廊' in txt and '没有结局' in txt, '进入回廊开场场景')
    pick(page, '踏入回廊')
    txt = scene_text(page)
    check('回廊门厅' in txt and '最深纪录：第 0 层' in txt, '抵达回廊门厅')
    check(page.evaluate('G.state.flags.endless') == True, 'state.flags.endless 已标记')
    check(page.evaluate('G.state.flags.endlessDepth') == 0, '初始层数为 0')
    check(page.evaluate('JSON.parse(localStorage.getItem("starfall_rpg_save_v1")).scene') == 'endless_lobby', '门厅已作为检查点存档')
    check('回廊0层' in page.locator('#charpanel .cp-sub').inner_text(), '面板徽章显示回廊层数')
    choices = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('迎战第 1 层' in c for c in choices), '门厅迎战选项指向第 1 层')
    check(any('雾更深一分' in c for c in choices), '普通层副标题提示')
    check(not any('星尘泉水' in c for c in choices), '第 0 层无泉水选项')
    check(any('营地休整' in c for c in choices), '营地休整可选')
    screenshot(page, '31_endless_lobby.png')

    # ================= 4. 第 1 层：普通层战斗与破层 =================
    pick(page, '迎战第 1 层')
    page.wait_for_timeout(600)
    check(page.locator('#view-combat').is_visible(), '第 1 层战斗开始')
    sc = page.evaluate('Combat.C.scale')
    check(abs(sc['hpMul'] - 1) < 1e-9 and sc['dmgAdd'] == 0, '第 1 层（0 重已破）无额外缩放')
    check('迷雾回廊 · 第 1 层' in page.locator('#log').inner_text(), '战斗日志标注回廊层数')
    win_fight(page)
    txt = scene_text(page)
    check('【迷雾回廊' in txt and '已破开 1 重雾墙' in txt, '破层结算显示新层数与纪录')
    check(page.evaluate('G.state.flags.endlessDepth') == 1, '层数 +1')
    check(page.evaluate('Endless.best()') == 1, '最深纪录刷新为 1')
    pick(page, '返回门厅')
    txt = scene_text(page)
    check('已破开 1 重雾墙' in txt, '门厅显示当前进度')
    check('回廊1层' in page.locator('#charpanel .cp-sub').inner_text(), '面板徽章层数更新')

    # ================= 5. 直达第 5 层：回响头目 + 遗物回礼 =================
    page.evaluate('G.state.flags.endlessDepth = 4; Save.write(G.state); Story.goto("endless_lobby")')
    scene_text(page)
    choices = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('迎战第 5 层' in c and '回响头目' in c for c in choices), '第 5 层选项标注回响头目')
    check(not any('星尘泉水' in c for c in choices), '非五层节点（已破 4 层）无泉水')
    pick(page, '迎战第 5 层')
    page.wait_for_timeout(600)
    base = page.evaluate('Combat.C.enemies[0].base')
    check(base == 'worm_echo', '第 5 层头目为掘地虫的回响: ' + base)
    sc = page.evaluate('Combat.C.scale')
    check(abs(sc['hpMul'] - 1.6) < 1e-9 and sc['dmgAdd'] == 2, '第 5 层缩放 = 1+0.15×4，伤害 +2: ' + json.dumps(sc))
    check(page.evaluate('Combat.C.enemies[0].maxHp') == 184, '回响生命 115 → round(115×1.6)=184')
    boss_pool = page.evaluate('Object.values(DATA.CARDS).filter(c => c.rarity === "boss" && (!c.cls || c.cls === G.state.player.cls)).length')
    check(boss_pool == 2, '第 5 层起头目卡进入奖励池（法师可用 2 张）')
    win_fight(page)
    txt = scene_text(page)
    check('回响头目的回礼' in txt, '头目战结算提示遗物回礼')
    picks = page.evaluate('G.state.flags.endlessPicks')
    check(isinstance(picks, list) and len(picks) == 3, '三件未持有遗物进入回礼列表')
    check(page.evaluate('Endless.best()') == 5, '最深纪录刷新为 5')
    check(page.evaluate('Achieve.has("endless_5")'), '成就「初入回廊」解锁')
    screenshot(page, '32_endless_boss_relic.png')
    n_rel_btns = page.locator('#choices .choice-btn', has_text='收下').count()
    check(n_rel_btns == 3, '三个遗物选项（实得 %d）' % n_rel_btns)
    page.locator('#choices .choice-btn', has_text='收下').first.click()
    page.wait_for_timeout(400)
    check(page.evaluate('hasRelic(G.state, "%s")' % picks[0]), '回礼遗物已收入行囊: ' + picks[0])
    check(page.evaluate('G.state.relics.length') == 1, '遗物列表唯一（不重复）')
    check(page.evaluate('G.state.flags.endlessPicks') is None, '回礼列表已清空')
    txt = scene_text(page)
    check('已破开 5 重雾墙' in txt, '返回门厅后层数为 5')

    # ================= 6. 星尘泉水与营地休整 =================
    # 先把生命压低再重新进入门厅，让选项按新状态重渲染（选项禁用态在渲染时求值）
    page.evaluate('G.state.player.hp = 10; Story.goto("endless_lobby")')
    scene_text(page)
    pick(page, '星尘泉水')
    txt = scene_text(page)
    check('一泓泉水' in txt and '每五层' in txt, '泉水场景文案')
    mx = page.evaluate('G.state.player.maxHp')
    check(page.evaluate('G.state.player.hp') == min(mx, 10 + round(mx * 0.6)),
          '泉水恢复 60%% 生命（10 + %d，上限 %d）' % (round(mx * 0.6), mx))
    check(page.evaluate('G.state.flags.endlessSpringFloor') == 5, '泉水使用层数已记录（本五层不再刷新）')
    pick(page, '回到门厅')
    scene_text(page)
    check(not any('星尘泉水' in c for c in page.locator('#choices .choice-btn').all_inner_texts()), '同一五层内泉水不再出现')
    gold0 = page.evaluate('G.state.player.gold')
    page.evaluate('G.state.player.gold = 100; UI.renderHud()')
    pick(page, '营地休整')
    txt = scene_text(page)
    check(page.evaluate('G.state.player.gold') == 55, '休整花费 20 + 5×5 = 45 金币')
    check(page.evaluate('G.state.player.hp') == page.evaluate('G.state.player.maxHp'), '休整恢复 40% 生命（上限截断）')

    # ================= 7. 倒下与检查点：纪录不灭 =================
    pick(page, '迎战第 6 层')
    page.wait_for_timeout(600)
    page.evaluate('Combat.lose()')
    page.wait_for_timeout(1400)
    check(page.locator('#view-death').is_visible(), '战斗失败进入死亡画面')
    sub = page.locator('#view-death .death-sub').inner_text()
    check('迷雾回廊第 5 层倒下' in sub and '最深纪录：第 5 层' in sub, '死亡画面显示回廊层数与纪录: ' + sub)
    screenshot(page, '33_endless_death.png')
    page.click('#d-retry')
    page.wait_for_timeout(600)
    txt = scene_text(page)
    check('回廊门厅' in txt and page.evaluate('G.state.flags.endlessDepth') == 5, '从门厅检查点复活，层数保留')

    # ================= 8. 深层成就与离开回廊 =================
    page.evaluate('Endless.reach(10); Achieve.check(G.state)')
    check(page.evaluate('Achieve.has("endless_10")'), '成就「回廊行者」解锁（10 层）')
    page.evaluate('Endless.reach(15); Achieve.check(G.state)')
    check(page.evaluate('Achieve.has("endless_15")'), '成就「雾渊之主」解锁（15 层）')
    pick(page, '离开回廊')
    page.wait_for_timeout(400)
    check(page.locator('#view-title').is_visible(), '离开回廊回到标题')
    check('最深 15 层' in page.locator('#t-endless').inner_text(), '标题按钮更新最深纪录 15 层')
    cyc = json.loads(page.evaluate('localStorage.getItem("starfall_rpg_endless_v1")'))
    check(cyc['best'] == 15, '最深纪录持久化（localStorage）')
    screenshot(page, '34_title_endless_best.png')

    # ================= 9. 回归验证：新的冒险不受影响 =================
    page.click('#t-new')
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '游侠')
    scene_text(page)
    pick(page, '磨砺')
    txt = scene_text(page)
    check('哥布林' in txt, '普通新开局仍进入主线序章')
    check(page.evaluate('G.state.flags.endless') == None, '普通开局不带回廊标记')
    check(page.evaluate('G.state.flags.endlessDepth') == None, '普通开局无层数字段')

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
print('✓ 迷雾回廊（无尽模式）测试全部通过')
