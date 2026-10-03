# -*- coding: utf-8 -*-
"""星坠之谜 · 回廊异变（质数层侧门事件）测试：
侧门出现规则 / 单次性 / 随机路由 / 六种异变收益与代价 / endless_pass 破层 /
异变致死 / 行商货架持久化 / 新成就 / 纪录持久化 / 非回廊局回归"""
import sys, io, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file:///' + os.path.join(ROOT, 'index.html').replace('\\', '/')
SHOT = os.path.join(ROOT, 'tools', 'shots')
os.makedirs(SHOT, exist_ok=True)

errors = []

def check(cond, msg):
    if cond:
        print('  OK ' + msg)
    else:
        print('  FAIL ' + msg)
        errors.append(msg)

def screenshot(page, name):
    page.screenshot(path=os.path.join(SHOT, name))

def dismiss(page):
    """升级祝福拦截是全局的：停在祝福场景就自动放弃，继续既有流程"""
    page.evaluate('''(async () => {
      for (let i = 0; i < 40; i++) {
        if (!(G.state && G.state.scene === 'blessing')) break;
        const b = document.querySelectorAll('#choices .choice-btn');
        if (b.length) b[b.length - 1].click();
        await new Promise(r => setTimeout(r, 150));
      }
    })()''')
    page.wait_for_timeout(100)

def scene_text(page):
    dismiss(page)
    page.click('#scene-text')  # 跳过打字机
    page.wait_for_timeout(200)
    return page.locator('#scene-text').inner_text()

def pick(page, text):
    page.locator('#choices .choice-btn', has_text=text).click()
    page.wait_for_timeout(400)
    dismiss(page)

def pick_nth(page, text, n=0):
    page.locator('#choices .choice-btn', has_text=text).nth(n).click()
    page.wait_for_timeout(400)
    dismiss(page)

def choices(page):
    return page.locator('#choices .choice-btn').all_inner_texts()

def ev(page, expr):
    return page.evaluate(expr)

def set_depth(page, d):
    """直接设定回廊层数并回到门厅（写入存档保持检查点一致）"""
    page.evaluate('G.state.flags.endlessDepth = %d; Save.write(G.state); Story.goto("endless_lobby")' % d)
    scene_text(page)

def door_visible(page):
    return any('雾中侧门' in c for c in choices(page))

def goto_event(page, scene_id):
    page.evaluate('Story.goto("%s")' % scene_id)
    scene_text(page)

def win_fight(page):
    page.evaluate('Combat.C.enemies.forEach(e => e.hp = 0); Combat.win()')
    page.wait_for_timeout(1200)
    page.click('#btn-skip-reward')
    page.wait_for_timeout(500)
    dismiss(page)

def xp_after(xp0, lvl0, gain):
    """镜像 gainXp：经验跨过升级线会被扣除，绝对值断言需按等级折算"""
    xpv, lvl = xp0 + gain, lvl0
    while xpv >= 25 * lvl:
        xpv -= 25 * lvl
        lvl += 1
    return xpv, lvl

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    console_msgs = []
    page.on('console', lambda m: console_msgs.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append('pageerror: ' + str(e))))

    # ================= 1. 种子周目记录，解锁回廊入口 =================
    page.goto(URL)
    page.evaluate('localStorage.clear()')
    page.evaluate('localStorage.setItem("starfall_rpg_cycle_v1", JSON.stringify({count: 1, relics: [], gold: 0}))')
    page.reload()
    page.wait_for_timeout(600)
    check(page.locator('#t-endless').count() == 1, '种子周目后标题出现迷雾回廊按钮')

    # ================= 2. 回廊开局 → 门厅 =================
    page.click('#t-endless')
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '法师')
    txt = scene_text(page)
    check('走多险的路' in txt, '回廊开局同样经过难度选择')
    pick(page, '磨砺')
    txt = scene_text(page)
    check('门洞' in txt and '雾也不敢看' in txt, '回廊开场预告侧门的存在')
    pick(page, '踏入回廊')
    txt = scene_text(page)
    check('回廊门厅' in txt, '抵达门厅')

    # ================= 3. 侧门出现规则：质数层且非五层头目 =================
    check(not door_visible(page), '第 1 层（非质数）无侧门')
    set_depth(page, 1)
    check(door_visible(page), '第 2 层（质数）出现侧门')
    check('门洞' in scene_text(page), '门厅文案提示门洞')
    check(any('第 2 层' in c for c in choices(page) if '侧门' in c), '侧门选项标注所属层')
    set_depth(page, 4)
    check(not door_visible(page), '第 5 层（头目节点）无侧门，即使 5 是质数')
    set_depth(page, 9)
    check(not door_visible(page), '第 10 层（头目节点）无侧门')
    set_depth(page, 10)
    check(door_visible(page), '第 11 层（质数）出现侧门')
    screenshot(page, '40_lobby_door.png')

    # ================= 4. 穿门路由（固定随机数）与门的一次性 =================
    page.evaluate('window.__rand = Math.random; Math.random = () => 0')  # 路由固定到第一个异变
    pick(page, '雾中侧门')
    page.evaluate('Math.random = window.__rand')
    scene_text(page)
    check(ev(page, 'G.state.scene') == 'ev_stele', '固定随机路由到第一个异变：星辉石碑')
    check(ev(page, 'G.state.flags.endlessDoorFloor') == 11, '门洞归属层已记录（第 11 层）')
    check(ev(page, 'Endless.doors()') == 1, '穿门计数 +1')
    check('ev_stele' in ev(page, 'Endless.events()'), '异变收录：星辉石碑')
    check(any('沁红' in c for c in choices(page)) and any('星辉' in c for c in choices(page)) and any('铜绿' in c for c in choices(page)), '石碑三道凹槽可选')

    # 同层不重复开门：直接回门厅（不破层），侧门应消失
    page.evaluate('Story.goto("endless_lobby")')
    scene_text(page)
    check(not door_visible(page), '同一层的侧门只出现一次')

    # ================= 5. 星辉石碑：血槽换遗物，破层下行 =================
    # 工作层：12（第 13 层为质数）。第 4 步的门洞记号（11）不挡第 13 层。
    set_depth(page, 12)
    page.evaluate('delete G.state.flags.endlessLastEvent')
    page.evaluate('window.__rand = Math.random; Math.random = () => 0')
    pick(page, '雾中侧门')
    page.evaluate('Math.random = window.__rand')
    scene_text(page)
    check(ev(page, 'G.state.scene') == 'ev_stele', '清除上次异变后仍可固定路由到石碑')
    mx = ev(page, 'G.state.player.maxHp')
    pick(page, '沁红的凹槽')  # fxFn：hpPct -15 + 随机未持有遗物 → endless_pass
    scene_text(page)
    check(ev(page, 'G.state.player.hp') == mx - round(mx * 0.15), '血槽失去 15%% 生命上限（%d → %d）' % (mx, mx - round(mx * 0.15)))
    check(ev(page, 'G.state.relics.length') == 1, '血槽换来一件未持有的遗物')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '异变结算后破层下行（12 → 13）')
    check(ev(page, 'Endless.best()') == 13, '最深纪录同步刷新')
    check(ev(page, 'G.state.scene') == 'endless_lobby', '结算后回到门厅')
    check(ev(page, 'JSON.parse(localStorage.getItem("starfall_rpg_save_v1")).scene') == 'endless_lobby', '门厅检查点已随破层更新')
    screenshot(page, '41_stele_blood.png')

    # 梦槽（直接进入场景验证收益；经验断言按升级折算）
    set_depth(page, 12)
    goto_event(page, 'ev_stele')
    xp0, lvl0 = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    pick(page, '浮着星辉的凹槽')
    scene_text(page)
    xv, lv = xp_after(xp0, lvl0, 25 + 6 * 12)
    ax, al = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    check(ax == xv and al == lv, '梦槽获得 25 + 6×深度 经验（含升级折算）（期望 xp=%s lvl=%s，实际 xp=%s lvl=%s）' % (xv, lv, ax, al))
    check(ev(page, 'G.state.flags.endlessDepth') == 13 and ev(page, 'G.state.scene') == 'endless_lobby', '梦槽同样破层回门厅')

    # ================= 6. 石碑血槽致死：异变代价可以致命 =================
    set_depth(page, 12)
    goto_event(page, 'ev_stele')
    hp_entry = ev(page, 'G.state.player.hp')  # 检查点=进入异变时的状态
    page.evaluate('G.state.player.hp = 1')
    pick(page, '沁红的凹槽')
    page.wait_for_timeout(900)
    check(page.locator('#view-death').is_visible(), '生命不足以支付血槽 → 死亡结算')
    page.click('#d-retry')
    page.wait_for_timeout(600)
    scene_text(page)
    check(ev(page, 'G.state.scene') == 'ev_stele' and ev(page, 'G.state.player.hp') == hp_entry, '检查点复活在异变场景，生命为进门前数值')
    pick(page, '浮着星辉的凹槽')  # 从异变场景正常离开
    scene_text(page)

    # ================= 7. 拾荒者的篝火：休整 / 必成与必败的赌局 / 买牌 =================
    # 注意：选项的禁用态在渲染时求值，压血必须在进入场景之前
    set_depth(page, 12)
    page.evaluate('G.state.player.hp = G.state.player.maxHp - 10')
    goto_event(page, 'ev_campfire')
    pick(page, '借火烤干斗篷')
    scene_text(page)
    check(ev(page, 'G.state.player.hp') == ev(page, 'G.state.player.maxHp'), '篝火休整恢复 30% 生命（上限截断）')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '休整后破层')

    set_depth(page, 12)
    goto_event(page, 'ev_campfire')
    page.evaluate('G.state.player.stats.int = 20')  # 智力检定必成
    g0 = ev(page, 'G.state.player.gold')
    pick(page, '星尘骰')
    scene_text(page)
    pick(page, '继续')
    scene_text(page)
    check(ev(page, 'G.state.player.gold') == g0 + 30 + 8 * 12, '赌局必成：赢得 30 + 8×深度 金币')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '赌胜后破层')

    set_depth(page, 12)
    goto_event(page, 'ev_campfire')
    page.evaluate('G.state.player.stats.int = -20; G.state.player.gold = 500')  # 检定必败
    pick(page, '星尘骰')
    scene_text(page)
    pick(page, '继续')
    scene_text(page)
    check(ev(page, 'G.state.player.gold') == 500 - (15 + 4 * 12), '赌局必败：输掉 15 + 4×深度 金币')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '赌败同样破层（承诺制）')

    set_depth(page, 12)
    goto_event(page, 'ev_campfire')
    page.evaluate('G.state.player.gold = 500')
    n0 = ev(page, 'G.state.deck.length')
    pick(page, '翻看他的货担')
    scene_text(page)
    check(ev(page, 'G.state.deck.length') == n0 + 1, '货担换来一张新牌')
    check(ev(page, 'G.state.player.gold') == 500 - (25 + 5 * 12), '货担标价 25 + 5×深度')
    check(ev(page, 'DATA.CARDS[G.state.deck[G.state.deck.length - 1]].rarity') in ('common', 'rare'), '货担只出普通/稀有牌')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '买牌后破层')

    # ================= 8. 雾中行商：货架、购买、下架、破层、持久化 =================
    # 金币在进入前调足：购入选项的禁用态在渲染时固化，渲染后补钱不会解禁
    set_depth(page, 12)
    page.evaluate('G.state.player.gold = 2000')
    goto_event(page, 'ev_merchant')
    d = ev(page, 'G.state.flags.endlessDepth')
    stock = ev(page, 'G.state.flags.endlessStock')
    check(isinstance(stock, list) and len(stock) == 3, '货架有三件货')
    check([o['kind'] for o in stock] == ['card', 'item', 'gear'], '货担固定为卡牌/物品/装备三类')
    check(stock[0]['price'] == 25 + 5 * d, '卡牌价格 25 + 5×深度')
    check(stock[2]['price'] == 40 + 8 * d, '装备价格 40 + 8×深度')
    check(stock[1]['price'] == ev(page, 'Math.round((DATA.ITEMS[G.state.flags.endlessStock[1].id].price || 30) * (1 + 0.08 * G.state.flags.endlessDepth))'), '物品价格按基础价 ×(1+0.08×深度)')
    check(len(choices(page)) == 4, '三个购入选项 + 道别')
    screenshot(page, '42_merchant.png')

    n0 = ev(page, 'G.state.deck.length')
    pick_nth(page, '购入【', 0)  # 货担顺序固定：卡牌 → 物品 → 装备
    scene_text(page)
    check(ev(page, 'G.state.deck.length') == n0 + 1, '购入卡牌加入牌组')
    check(ev(page, 'G.state.flags.endlessStock[0]') is None, '售出即下架')
    check(len([c for c in choices(page) if '购入' in c]) == 2, '货架上只剩两件货')

    it0 = json.dumps(ev(page, 'G.state.items'))
    page.evaluate('G.state.player.gear = {}')  # 确保装备 JSON 必变（随机货可能正是当前穿戴件）
    g0 = json.dumps(ev(page, 'G.state.player.gear'))
    pick_nth(page, '购入【', 0)
    scene_text(page)
    check(ev(page, 'G.state.flags.endlessStock[1]') is None, '物品售出下架')
    pick_nth(page, '购入【', 0)
    scene_text(page)
    check(ev(page, 'G.state.flags.endlessStock[2]') is None, '装备售出下架')
    check(json.dumps(ev(page, 'G.state.player.gear')) != g0, '购入装备已更换槽位')
    check(json.dumps(ev(page, 'G.state.items')) != it0, '购入物品已入行囊')

    # 货架随存档持久化：刷新后继续冒险，货架不变（已购的不复活）
    stock_before = ev(page, 'JSON.stringify(G.state.flags.endlessStock)')
    page.reload()
    page.wait_for_timeout(600)
    page.click('#t-continue')
    page.wait_for_timeout(600)
    scene_text(page)
    check(ev(page, 'G.state.scene') == 'ev_merchant', '刷新后从检查点回到行商窄廊')
    check(ev(page, 'JSON.stringify(G.state.flags.endlessStock)') == stock_before, '货架随存档持久化（已购的不复活）')

    g0 = ev(page, 'G.state.player.gold')
    d0 = ev(page, 'G.state.flags.endlessDepth')
    pick(page, '道别')
    scene_text(page)
    check(ev(page, 'G.state.flags.endlessDepth') == d0 + 1, '道别后破层下行')
    check(ev(page, 'G.state.player.gold') == g0, '道别不产生额外收支')

    # ================= 9. 雾影窃贼：先偷后算 =================
    set_depth(page, 12)
    gb = ev(page, 'G.state.player.gold')
    goto_event(page, 'ev_thief')
    check(ev(page, 'G.state.player.gold') == gb - (10 + 3 * 12), '入画即被偷走 10 + 3×深度 金币')
    check('掠走了 %d 金币' % (10 + 3 * 12) in scene_text(page), '开场追加被窃消息')
    page.evaluate('G.state.player.stats.agi = 20')  # 敏捷检定必成
    g0 = ev(page, 'G.state.player.gold')  # 检定结算在点击瞬间完成，须先读基数
    pick(page, '追进雾里')
    scene_text(page)
    pick(page, '继续')
    scene_text(page)
    check(ev(page, 'G.state.player.gold') == g0 + 25 + 7 * 12, '追上窃贼：夺回 25 + 7×深度 金币')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '追贼后破层')

    set_depth(page, 12)
    goto_event(page, 'ev_thief')
    page.evaluate('G.state.player.stats.agi = -20; G.state.player.gold = 500')  # 检定必败
    scene_text(page)
    hp0 = ev(page, 'G.state.player.hp')
    pick(page, '追进雾里')
    scene_text(page)
    pick(page, '继续')
    scene_text(page)
    check(ev(page, 'G.state.player.gold') == 500 - (12 + 4 * 12), '追贼失败：再丢 12 + 4×深度 金币')
    check(ev(page, 'G.state.player.hp') == hp0 - round(ev(page, 'G.state.player.maxHp') * 0.05), '追贼失败擦伤：失去 5% 生命上限')

    set_depth(page, 12)
    goto_event(page, 'ev_thief')
    xp0, lvl0 = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    pick(page, '就当喂了雾')
    scene_text(page)
    xv, lv = xp_after(xp0, lvl0, 8 + 2 * 12)
    ax, al = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    check(ax == xv and al == lv, '喂雾换经验：8 + 2×深度（含升级折算）（期望 xp=%s lvl=%s，实际 xp=%s lvl=%s）' % (xv, lv, ax, al))

    # ================= 10. 星尘裂隙：瓶装光 / 丈量 =================
    set_depth(page, 12)
    goto_event(page, 'ev_crack')
    pick(page, '装一瓶裂隙里的光')
    scene_text(page)
    check(ev(page, 'G.state.items.star_dew') == 1, '裂隙装瓶得到星辉露珠')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '装瓶后破层')
    set_depth(page, 12)
    goto_event(page, 'ev_crack')
    xp0, lvl0 = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    pick(page, '丈量裂隙的走向')
    scene_text(page)
    xv, lv = xp_after(xp0, lvl0, 18 + 5 * 12)
    ax, al = ev(page, 'G.state.player.xp'), ev(page, 'G.state.player.level')
    check(ax == xv and al == lv, '丈量得到 18 + 5×深度 经验（含升级折算）（期望 xp=%s lvl=%s，实际 xp=%s lvl=%s）' % (xv, lv, ax, al))

    # ================= 11. 坍塌的暗室：抢了就跑 / 应战照常破层 =================
    set_depth(page, 12)
    goto_event(page, 'ev_ambush')
    hp0 = ev(page, 'G.state.player.hp')
    g0 = ev(page, 'G.state.player.gold')
    pick(page, '抓起行囊')
    scene_text(page)
    check(ev(page, 'G.state.player.gold') == g0 + 30 + 8 * 12, '抢了就跑：夺得 30 + 8×深度 金币')
    check(ev(page, 'G.state.player.hp') == hp0 - round(ev(page, 'G.state.player.maxHp') * 0.08), '挤出裂缝擦伤：失去 8% 生命上限')
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '逃出暗室后破层')

    set_depth(page, 12)
    goto_event(page, 'ev_ambush')
    pick(page, '提械备战')
    page.wait_for_timeout(600)
    check(page.locator('#view-combat').is_visible(), '应战进入战斗')
    check(ev(page, 'Combat.C.enemies.every(e => ["lurker","spider"].includes(e.base))'), '暗室伏兵为潜伏者+毒蛛')
    check('迷雾回廊 · 第 13 层' in page.locator('#log').inner_text(), '战斗日志标注异变所属层')
    win_fight(page)
    scene_text(page)
    pick(page, '返回门厅')
    scene_text(page)
    check(ev(page, 'G.state.flags.endlessDepth') == 13, '伏兵战胜照常走破层结算（endless_clear）')

    # ================= 12. 真实随机的穿门路由落在六种异变之内 =================
    set_depth(page, 16)  # 第 17 层为质数，且未被此前的门洞记号（13）挡住
    pick(page, '雾中侧门')
    scene_text(page)
    check(ev(page, 'DATA.ENDLESS_EVENTS.includes(G.state.scene)'), '真实随机路由到六种异变之一: ' + str(ev(page, 'G.state.scene')))

    # ================= 13. 新成就：叩门者 / 异变全识 =================
    page.evaluate('while (Endless.doors() < 10) Endless.door(); Achieve.check(G.state)')
    check(ev(page, 'Achieve.has("door_10")'), '成就「叩门者」解锁（10 扇侧门）')
    page.evaluate('DATA.ENDLESS_EVENTS.forEach(id => Endless.markEvent(id)); Achieve.check(G.state)')
    check(ev(page, 'Achieve.has("ev_all")'), '成就「异变全识」解锁（六种异变全见）')
    saved = json.loads(page.evaluate('localStorage.getItem("starfall_rpg_endless_v1")'))
    check(saved['doors'] == 10 and len(saved['ev']) == 6, 'doors / ev 跨周目持久化')
    screenshot(page, '43_ev_achievements.png')

    # 成就总数进标题
    page.evaluate('Story.goto("endless_lobby")')
    scene_text(page)
    pick(page, '离开回廊')
    page.wait_for_timeout(400)
    achv_total = page.evaluate('Object.keys(DATA.ACHIEVEMENTS).length')
    check(str(achv_total) in page.locator('#t-achv').inner_text(), '标题成就计数更新为 %d' % achv_total)

    # ================= 14. 回归：普通局不受侧门影响 =================
    page.evaluate('localStorage.removeItem("starfall_rpg_save_v1")')
    page.reload()
    page.wait_for_timeout(600)
    page.click('#t-new')
    page.wait_for_timeout(400)
    scene_text(page)
    pick(page, '战士')
    scene_text(page)
    pick(page, '磨砺')
    page.evaluate('G.state.scene = "prologue"; Save.write(G.state); Story.goto("endless_lobby")')
    scene_text(page)
    check(not door_visible(page), '非回廊存档进入门厅也不显示侧门（flags 无 endless）')

    # ================= 收尾 =================
    check(not console_msgs, '无控制台错误: ' + ('; '.join(console_msgs[:3]) if console_msgs else '干净'))
    browser.close()

print()
if errors:
    print('✗ %d 项失败' % len(errors))
    sys.exit(1)
print('✓ 回廊异变全部通过')
