# -*- coding: utf-8 -*-
"""星坠之谜 · 星祭司与观星屋测试：第四职业开局 / 星兆问卜与逐场消耗 /
开战加护钩子 / 圣裁 smite / 观星屋购置 / 笔记与成就 / 存档持久"""
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

def scene_text(page):
    return page.locator('#scene-text').inner_text()

def goto_scene(page, sid):
    page.evaluate('Story.goto("%s")' % sid)
    page.wait_for_timeout(300)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    page.evaluate('dismissBlessings()')

def click_choice(page, text):
    page.locator('#choices .choice-btn', has_text=text).first.click()
    page.wait_for_timeout(400)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    page.evaluate('dismissBlessings()')

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
# 直接打出一张手牌并等结算完成（单体卡自动选取第一名存活敌人）
PLAY_JS = '''
window.playFirst = async function (targetUid) {
  const C = Combat.C;
  if (!C) return false;
  for (let i = 0; i < 40 && C.busy; i++) await new Promise(r => setTimeout(r, 120));
  const card = DATA.CARDS[C.hand[0]];
  let uid = targetUid || null;
  if (!uid && card.target === 'enemy') {
    const alive = C.enemies.filter(e => e.hp > 0);
    uid = alive.length ? alive[0].uid : null;
  }
  await Combat.playCard(0, uid);
  for (let i = 0; i < 40 && C.busy && !C.over; i++) await new Promise(r => setTimeout(r, 120));
  return true;
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
    page.evaluate(PLAY_JS)

    # ================= 1. 星祭司开局 =================
    print('== 星祭司开局 ==')
    page.click('#t-new')
    page.wait_for_timeout(400)
    page.click('#scene-text')   # 跳过打字机，渲染职业选项
    page.wait_for_timeout(300)
    check(page.locator('#choices .choice-btn', has_text='星祭司').count() == 1, '序章出现第四职业「星祭司」')
    page.locator('#choices .choice-btn', has_text='星祭司').click()
    page.wait_for_timeout(300)
    page.click('#scene-text')
    page.locator('#choices .choice-btn', has_text='磨砺').click()
    page.wait_for_timeout(300)
    check(ev(page, 'G.state.player.cls') == 'priest', '职业选择生效：priest')
    check(ev(page, 'G.state.player.maxHp') == 68, '星祭司生命上限 68')
    check(ev(page, 'G.state.player.stats.int') == 3 and ev(page, 'G.state.player.stats.cha') == 3, '星祭司 智力/魅力 3/3')
    check(ev(page, 'G.state.deck.length') == 11, '初始牌组 11 张')
    check(ev(page, '["star_bolt","halo","star_mend","prayer","star_blade"].every(id => G.state.deck.includes(id))'), '初始牌组含五张星祭司起始卡')
    check(ev(page, 'gearBonus(G.state).atk') == 1, '初始武器加成为 1（橡木法杖）')

    # ================= 2. 观星屋与问卜 =================
    print('== 观星屋与问卜 ==')
    goto_scene(page, 'town')
    check(page.locator('#choices .choice-btn', has_text='观星屋').count() == 1, '镇中心出现观星屋入口')
    goto_scene(page, 'stargazer')
    check('星盘' in scene_text(page) and '薇拉' in scene_text(page), '观星屋初访文本')
    goto_scene(page, 'stargazer')
    check('要再问一卦' in scene_text(page), '观星屋再访文本（回头客分支）')
    page.evaluate('G.state.player.gold = 200')
    click_choice(page, '观星问卜')
    check(ev(page, 'G.state.player.gold') == 170, '问卜花费 30 金币')
    check(ev(page, '(G.state.flags.omenList || []).filter(o => o.battles > 0).length') == 1, '获得一道星兆（battles > 0）')
    check(ev(page, 'G.state.stats.starsRead') == 1, '问卜计数 +1')
    check(ev(page, 'G.state.scene') == 'stargazer', '问卜后留在观星屋')
    check('星 兆' in page.locator('#charpanel').inner_text(), '角色面板出现「星兆」栏')
    page.screenshot(path=os.path.join(SHOT, '61_stargazer.png'))

    # 问卜两次凑满 3 次 → 成就
    page.evaluate('G.state.player.gold = 200')
    click_choice(page, '观星问卜')
    page.evaluate('G.state.player.gold = 200')
    click_choice(page, '观星问卜')
    check(ev(page, 'G.state.stats.starsRead') == 3, '累计问卜 3 次')
    check(ev(page, 'Achieve.has("omen_3")'), '成就「观星常客」解锁')

    # 金币不足时问卜按钮禁用
    page.evaluate('G.state.player.gold = 10')
    goto_scene(page, 'stargazer')
    disabled = ev(page, '''(() => { const b = [...document.querySelectorAll('#choices .choice-btn')].find(x => x.textContent.includes('观星问卜')); return b ? b.disabled : null; })()''')
    check(disabled is True, '金币不足时问卜按钮禁用')

    # ================= 3. 星兆逐场消耗与开战加护 =================
    print('== 星兆开战加护 ==')
    # 岁星拱卫：开战 6 护甲，次数 2 → 1
    page.evaluate('''() => {
        G.state.flags.omenList = [{ id: 'omen_ward', name: '岁星拱卫', desc: '战斗开始时获得 6 点护甲', battles: 2, startBlock: 6 }];
    }''')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.player.block') == 6, '岁星拱卫：开战获得 6 点护甲')
    check(ev(page, 'Combat.C.omen.startBlock') == 6, '星兆聚合进本场战斗（omen.startBlock）')
    check(ev(page, 'G.state.flags.omenList[0].battles') == 1, '星兆次数消耗 2 → 1')
    Combat_abandon = ev(page, 'Combat.abandon(); Combat.C === null')
    check(Combat_abandon, '放弃战斗脱离战斗')

    # 战星高照 + 流星驻足 + 晦星蚀芒 叠加
    page.evaluate('''() => {
        G.state.flags.omenList = [
          { id: 'omen_war', name: '战星高照', desc: '', battles: 2, startStrength: 2 },
          { id: 'omen_star', name: '流星驻足', desc: '', battles: 2, energyFirst: 1 },
          { id: 'omen_fog', name: '晦星蚀芒', desc: '', battles: 1, enemyVuln: 1 },
        ];
        Combat.start("goblin_scout", "town");
    }''')
    page.wait_for_timeout(400)
    check(ev(page, 'Combat.C.player.statuses.strength') == 2, '战星高照：开战 2 层力量')
    check(ev(page, 'Combat.C.energy') == 4, '流星驻足：首回合行动力 3+1=4')
    check(ev(page, 'Combat.C.enemies[0].statuses.vuln') == 1, '晦星蚀芒：敌人开战 1 层易伤')
    check(ev(page, 'G.state.flags.omenList.filter(o => o.battles > 0).length') == 2, '次数耗尽的星兆已从列表移除（余 2 道）')

    # 血星低照：开战扣 4 血
    page.evaluate('''() => {
        Combat.abandon();
        G.state.flags.omenList = [{ id: 'omen_blood', name: '血星低照', desc: '', battles: 1, startLossHp: 4, xpPct: 50 }];
        G.state.player.hp = G.state.player.maxHp;
    }''')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(400)
    check(ev(page, 'G.state.player.hp') == ev(page, 'G.state.player.maxHp - 4'), '血星低照：开战失去 4 点生命')
    page.evaluate('Combat.abandon()')

    # 财星照命：胜利金币加成（日志可证）
    page.evaluate('''() => {
        G.state.flags.omenList = [{ id: 'omen_gold', name: '财星照命', desc: '', battles: 1, goldPct: 40 }];
        Combat.start("goblin_scout", "town");
    }''')
    page.wait_for_timeout(400)
    page.evaluate('''() => { const C = Combat.C; C.enemies[0].hp = 1; C.hand = ['star_bolt']; C.draw = []; C.discard = []; }''')
    page.evaluate('playFirst(null)')
    page.wait_for_timeout(800)
    check('财星照命' in page.locator('#log').inner_text(), '财星照命：胜利结算日志出现金币加成')
    check(ev(page, '(G.state.flags.omenList || []).length') == 0, '胜利后星兆次数耗尽并清空')

    # ================= 4. 圣裁（smite 特殊） =================
    print('== 圣裁 smite ==')
    page.evaluate('''() => {
        G.state.deck = ['judgement'];
        Combat.start("goblin_scout", "town");
    }''')
    page.wait_for_timeout(600)
    page.evaluate('''() => { const C = Combat.C; C.enemies[0].hp = 10; C.hand = ['judgement']; C.draw = []; C.discard = []; }''')
    page.evaluate('playFirst(null)')
    page.wait_for_timeout(600)
    check(ev(page, '!!(Combat.C && Combat.C.over)'), '圣裁：半血以下 19 伤害（18+武器）直接斩杀')
    page.evaluate('Combat.abandon()')
    page.evaluate('Combat.start("goblin_scout", "town")')
    page.wait_for_timeout(600)
    page.evaluate('''() => { const C = Combat.C; C.hand = ['judgement']; C.draw = []; C.discard = []; }''')
    page.evaluate('playFirst(null)')
    page.wait_for_timeout(600)
    check(ev(page, '!!(Combat.C && !Combat.C.over && Combat.C.enemies[0].hp)') and ev(page, 'Combat.C.enemies[0].hp') == 10, '圣裁：满血目标只造成 10 点伤害（9+武器）')
    page.evaluate('Combat.abandon()')

    # ================= 5. 观星屋购置与检定 =================
    print('== 观星屋购置 ==')
    page.evaluate('G.state.player.gold = 300')
    goto_scene(page, 'town')
    goto_scene(page, 'stargazer')
    click_choice(page, '陨铁护符')
    check(ev(page, 'hasRelic(G.state, "meteor_charm")'), '购入遗物「陨铁护符」')
    check(ev(page, 'relicSum(G.state).startStrength') == 1 and ev(page, 'relicSum(G.state).startBlock') == 3, '陨铁护符效果字段正确（力量 1 / 护甲 3）')
    check(ev(page, 'hasRelic(G.state, "meteor_charm")') and page.locator('#choices .choice-btn', has_text='陨铁护符').count() == 0, '已持有的遗物不再上架')
    click_choice(page, '星图解读')
    check(ev(page, 'G.state.deck.includes("star_reading")'), '购入卡牌【星图解读】')
    check(ev(page, 'Codex.has("cards", "star_reading")'), '新卡随存档自动收录进图鉴')
    check(ev(page, 'Codex.has("relics", "meteor_charm")'), '新遗物随存档自动收录进图鉴')

    # 智力检定：星祭司 int3+法杖? 法杖无 int → 检定加值 6； DC 12 必有成功/失败两分支，只验证不抛错且笔记/经验落到成功支
    page.evaluate('''() => { G.state.flags.asked_vera = false; }''')
    page.evaluate('Story.goto("stargazer")')
    page.wait_for_timeout(300)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    ok = ev(page, '''(() => { const b = [...document.querySelectorAll('#choices .choice-btn')].find(x => x.textContent.includes('推演星坠之夜')); if (b) b.click(); return !!b; })()''')
    page.wait_for_timeout(300)
    check(ok, '薇拉推演检定选项可点击')
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(200)
    check(ev(page, 'G.state.stats.checks') >= 1, '检定已计入统计')
    click_choice(page, '继续')   # 检定过场「▶ 继续」回到观星屋
    click_choice(page, '回到镇中心')

    # ================= 6. 笔记 · 成就 · 存档持久 =================
    print('== 笔记 · 成就 · 存档 ==')
    page.evaluate('G.state.flags.omenList = [{ id: "omen_war", name: "战星高照", desc: "战斗开始时获得 2 层力量", battles: 2, startStrength: 2 }]')
    page.evaluate('Save.write(G.state)')
    kept = ev(page, '''(() => { const st = Save.read(); return st && st.flags.omenList && st.flags.omenList.length === 1 && st.flags.omenList[0].battles === 2; })()''')
    check(kept, '星兆随存档持久化（读取后仍在）')
    page.evaluate('G.state.flags.bossDown = true; Achieve.check(G.state)')
    check(ev(page, 'Achieve.has("star_priest")'), '星祭司击败头目 → 成就「新星初升」解锁')
    check(ev(page, 'Object.keys(DATA.ACHIEVEMENTS).length') == 38, '成就总数 38（36 + 星祭司/观星 ×2）')

    # 推演成功支的笔记/经验注册在 success 分支上
    check(ev(page, 'DATA.NOTES.veras_prophecy && DATA.SCENES.stargazer.choices.some(c => c.success && c.success.fx && c.success.fx.note === "veras_prophecy")'), '推演成功支的笔记已注册')

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
print('✓ 星祭司与观星屋测试全部通过')
