# -*- coding: utf-8 -*-
"""星坠之谜 · 多周目与难度测试：难度选择 / NG+ 继承开局 / 敌人缩放 / 忘却之铃 / 新成就"""
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

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    page.on('console', lambda m: console_msgs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    # ================= 1. 首次运行：无 NG+ 按钮 =================
    page.goto(URL)
    page.evaluate('localStorage.clear()')
    page.reload()
    page.wait_for_timeout(600)
    check(page.evaluate('Cycle.count()') == 0, '初始周目数为 0')
    check(page.locator('#t-ngplus').count() == 0, '未通关时标题无继承开局按钮')

    # ================= 2. 首局：难度选择 → 通关（星光） =================
    page.click('#t-new')
    page.wait_for_timeout(400)
    txt = scene_text(page)
    check('你是谁' in txt, '序章职业选择')
    pick(page, '战士')
    txt = scene_text(page)
    check('走多险的路' in txt, '职业后进入难度选择场景')
    choices = page.locator('#choices .choice-btn').all_inner_texts()
    check(any('磨砺' in c for c in choices) and any('迷雾试炼' in c for c in choices), '两档难度可选')
    screenshot(page, '20_difficulty.png')
    pick(page, '磨砺')
    txt = scene_text(page)
    check('哥布林' in txt, '选择标准难度后进入序章')
    check(page.evaluate('G.state.diff') == 0 and page.evaluate('G.state.cycle') == 1, '难度/周目字段 = 0/1')
    check('第1周目' in page.locator('#charpanel .cp-sub').inner_text(), '面板显示周目徽章（无试炼标记）')

    # 造遗产并直达结局：2 件遗物 + 200 金币，星光结局
    page.evaluate('G.state.relics = ["watch", "wolf_whistle"]; G.state.player.gold = 200; G.state.flags.core = "pure";')
    page.evaluate('Story.goto("ending_light")')
    txt = scene_text(page)
    check('已记入星图' in txt and '继承开局' in txt, '结局文案提示周目记录与继承解锁')
    cyc = json.loads(page.evaluate('localStorage.getItem("starfall_rpg_cycle_v1")'))
    check(cyc['count'] == 1, '通关后周目数 = 1')
    check(cyc['relics'] == ['watch', 'wolf_whistle'] and cyc['gold'] == 200, '通关快照记录遗物与金币')
    screenshot(page, '21_ending_light.png')
    pick(page, '回到标题')
    page.wait_for_timeout(300)
    check(page.locator('#view-title').is_visible(), '回到标题')
    ng = page.locator('#t-ngplus')
    check(ng.count() == 1 and '第 2 周 目' in ng.inner_text(), '标题出现「第 2 周目 · 继承」按钮')
    screenshot(page, '22_title_ngplus.png')

    # ================= 3. NG+：继承开局 + 迷雾试炼 =================
    ng.click()
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '法师')   # NG+ 可以换职业
    txt = scene_text(page)
    check('【第 2 周目】' in txt and '星尘遗物 ×2' in txt, '难度场景展示周目与继承遗产')
    screenshot(page, '23_ngplus_difficulty.png')
    pick(page, '迷雾试炼')
    scene_text(page)
    check(page.evaluate('G.state.diff') == 1 and page.evaluate('G.state.cycle') == 2, '难度/周目字段 = 1/2')
    check(page.evaluate('G.state.player.gold') == 130, '继承金币 = 初始 30 + 上一世 200 的一半（%d）' % page.evaluate('G.state.player.gold'))
    check(page.evaluate('hasRelic(G.state, "watch") && hasRelic(G.state, "wolf_whistle")'), '继承全部星尘遗物')
    sub = page.locator('#charpanel .cp-sub').inner_text()
    check('第2周目' in sub and '试炼' in sub, '面板徽章：第2周目 · 迷雾试炼')

    # 敌人缩放：哥布林 20 血 → round(20×1.35×1.25) = 34；伤害 +3；奖励 ×1.4375
    pick(page, '迎战')
    page.wait_for_timeout(600)
    check(page.locator('#view-combat').is_visible(), '试炼难度下战斗开始')
    sc = page.evaluate('Combat.C.scale')
    check(abs(sc['hpMul'] - 1.6875) < 1e-9 and sc['dmgAdd'] == 3 and abs(sc['rewardMul'] - 1.4375) < 1e-9,
          '缩放系数正确: ' + json.dumps(sc))
    check(page.evaluate('Combat.C.enemies[0].maxHp') == 34, '哥布林生命 20 → 34')
    check('34 / 34' in page.locator('.e-hpnum').first.inner_text(), '敌人血条显示缩放后生命')
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1200)
    gold, xp = page.evaluate('Combat.C.rewards.gold'), page.evaluate('Combat.C.rewards.xp')
    check(6 <= gold <= 11, '金币奖励按 ×1.4375 放大（%d）' % gold)
    check(xp == 20, '经验奖励 14 → 20')
    screenshot(page, '24_scaled_reward.png')
    page.click('#btn-skip-reward')
    page.wait_for_timeout(500)

    # ================= 4. 忘却之铃（牌组瘦身） =================
    pick(page, '镇中心')
    scene_text(page)
    pick(page, '铃语斋')
    scene_text(page)
    deck0 = page.evaluate('G.state.deck.length')
    gold0 = page.evaluate('G.state.player.gold')
    pick(page, '忘却之铃')
    page.wait_for_timeout(300)
    mt = page.locator('.modal-box .modal-title').last.inner_text().replace(' ', '')
    check(mt == '忘却之铃', '忘却之铃弹窗打开: ' + mt)
    cards = page.locator('.modal-box .deck-card.forgetable')
    check(cards.count() == len(set(page.evaluate('G.state.deck'))), '弹窗展示牌组全部种类')
    # 两段确认：点打击卡 → 标记；再点 → 执行
    cards.first.click()
    page.wait_for_timeout(200)
    check('selected' in (cards.first.get_attribute('class') or ''), '首点仅标记卡牌')
    cards.first.click()
    page.wait_for_timeout(400)
    check(page.evaluate('G.state.deck.length') == deck0 - 1, '卡牌被移除（%d→%d）' % (deck0, page.evaluate('G.state.deck.length')))
    check(page.evaluate('G.state.player.gold') == gold0 - 40, '忘却扣款 40 金币')
    check(page.evaluate('G.state.stats.forgotten') == 1, '忘却计数 +1')
    saved_deck = json.loads(page.evaluate('localStorage.getItem("starfall_rpg_save_v1")'))['deck']
    check(len(saved_deck) == deck0 - 1, '移除结果已存档（存档牌组 %d 张）' % len(saved_deck))
    screenshot(page, '25_forget_done.png')
    page.locator('.modal-close').last.click()
    page.wait_for_timeout(200)

    # ================= 5. 二周目结局：diff_hard / cycle_2 成就 =================
    page.evaluate('G.state.stats.forgotten = 3; Achieve.check(G.state)')
    check(page.evaluate('Achieve.has("forget_3")'), '成就「忘却的铃声」解锁')
    page.evaluate('G.state.flags.core = "absorb"; Story.goto("ending_dark")')
    txt = scene_text(page)
    check('第 2 段旅程已记入星图。' in txt, '二周目结局文案（无解锁提示的句式）')
    check(page.evaluate('Achieve.has("diff_hard")'), '成就「试炼成王」解锁（迷雾试炼通关）')
    check(page.evaluate('Achieve.has("cycle_2")'), '成就「轮回之始」解锁（完成第 2 周目）')
    check(not page.evaluate('Achieve.has("cycle_3")'), '「雾中轮回」尚未解锁')
    check(page.evaluate('Cycle.count()') == 2, '周目数累计为 2')

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
print('✓ 多周目与难度测试全部通过')
