# -*- coding: utf-8 -*-
"""深度测试：全场景遍历 + 剧情通关（两结局路径）+ 死亡复活"""
import sys, io, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'file:///' + os.path.join(ROOT, 'index.html').replace('\\', '/')
SHOT = os.path.join(ROOT, 'tools', 'shots')
os.makedirs(SHOT, exist_ok=True)
errors = []

AUTO_BATTLE = '''
window.autoBattle = async function () {
  let guard = 0;
  while (Combat.C && !Combat.C.over && guard < 300) {
    guard++;
    const C = Combat.C;
    if (C.busy) { await new Promise(r => setTimeout(r, 250)); continue; }
    let played = false;
    for (let i = 0; i < C.hand.length; i++) {
      const c = DATA.CARDS[C.hand[i]];
      if (c.cost <= C.energy) {
        if (c.target === 'enemy') {
          const alive = C.enemies.filter(e => e.hp > 0);
          if (!alive.length) break;
          await Combat.playCard(i, alive[0].uid);
        } else {
          await Combat.playCard(i, null);
        }
        played = true;
        break;
      }
    }
    if (!played) { await Combat.endTurn(); }
    await new Promise(r => setTimeout(r, 120));
  }
  return Combat.C ? Combat.C.over : 'gone';
};
window.pickFirstReward = async function () {
  for (let i = 0; i < 40; i++) {
    if (document.querySelector('.reward-card')) {
      document.querySelector('.reward-card').click();
      return true;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};
'''

def check(cond, msg):
    if cond:
        print('  OK ' + msg)
    else:
        print('  FAIL ' + msg)
        errors.append(msg)

def goto_scene(page, sid):
    page.evaluate('Story.goto("%s")' % sid)
    page.wait_for_timeout(120)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(60)

def click_choice(page, text):
    page.locator('#choices .choice-btn', has_text=text).first.click()
    page.wait_for_timeout(200)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, channel='msedge')
    page = browser.new_page(viewport={'width': 1280, 'height': 860})
    page.on('pageerror', lambda e: (print('  [pageerror] ' + str(e)), errors.append(str(e))))
    page.on('console', lambda m: print('  [console:%s] %s' % (m.type, m.text)) if m.type == 'error' else None)

    page.goto(URL)
    page.wait_for_timeout(400)

    # ================= 1. 全场景遍历 =================
    print('== 全场景遍历 ==')
    page.click('#t-new')
    page.wait_for_timeout(200)
    page.click('#scene-text')
    page.locator('#choices .choice-btn', has_text='战士').click()
    page.wait_for_timeout(200)
    page.evaluate(AUTO_BATTLE)
    scenes = page.evaluate('Object.keys(DATA.SCENES)')
    bad = []
    for sid in scenes:
        try:
            page.evaluate('Story.goto("%s")' % sid)
            page.wait_for_timeout(60)
            empty = page.evaluate('document.getElementById("scene-text").textContent.length === 0')
            if empty:
                bad.append(sid + '(空文本)')
        except Exception as e:
            bad.append(sid + '(' + str(e)[:50] + ')')
    check(not bad, '遍历 %d 个场景无异常 %s' % (len(scenes), bad if bad else ''))

    # ================= 2. 通关流程（吸收→结局·新王） =================
    print('== 通关流程：吸收结局 ==')
    page.evaluate('''() => {
        G.state = newGameState("warrior");   /* 场景遍历污染了 flags，重置 */
        const st = G.state;
        st.player.maxHp = 400; st.player.hp = 400; st.player.gold = 9999;
        st.deck = ['heavy_slash','heavy_slash','heavy_slash','heavy_slash','heavy_slash',
                   'heavy_slash','heavy_slash','iron_wall','iron_wall','whirlwind','first_aid'];
        st.player.stats.pow = 5;
    }''')
    # —— 任务与笔记：镇长接取主线、酒馆听情报 ——
    goto_scene(page, 'elder')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "main_mine")'), '主线任务已记录（调查迷雾矿坑）')
    click_choice(page, '带回答案')
    goto_scene(page, 'tavern')
    click_choice(page, '请全桌喝一轮')
    check(page.evaluate('G.state.journal.notes.some(n => n.id === "tavern_rumor")'), '酒馆情报已入笔记')
    goto_scene(page, 'gate')
    click_choice(page, '出镇北行')
    check(page.evaluate('G.state.scene') == 'crossroads', '到达岔路口')
    click_choice(page, '黑松林')
    click_choice(page, '砍开一条路')
    click_choice(page, '迎战狼群')
    r = page.evaluate('autoBattle()'); page.wait_for_timeout(300)
    check(page.evaluate('pickFirstReward()'), '狼群胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'forest_treasure', '森林宝藏场景')
    click_choice(page, '矿坑入口')
    check(page.evaluate('G.state.scene') == 'mine_entrance', '抵达矿坑入口')
    click_choice(page, '深入矿坑')
    click_choice(page, '深入三层')
    click_choice(page, '决一死战')
    check(page.locator('#view-combat').is_visible(), '头目战·掘地虫开战')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '头目胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'worm_win', '巨虫倒下过场')
    check(page.evaluate('G.state.journal.quests.find(q => q.id === "main_mine").status') == 'done', '矿坑主线已完成')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "main_tower" && q.status === "active")'), '古塔主线已开启')
    click_choice(page, '冲回地面')
    check(page.evaluate('G.state.scene') == 'core_choice', '星核抉择场景')
    click_choice(page, '吸收它的力量')
    click_choice(page, '我要亲手终结')
    check(page.evaluate('G.state.scene') == 'tower_gate', '抵达古塔下（神秘旅人）')
    check(page.evaluate('G.state.deck.includes("shadow_rage")'), '获得影之怒')
    click_choice(page, '踏入古塔')
    check(page.evaluate('G.state.journal.notes.some(n => n.id === "morgan_words")'), '守塔人的话已入笔记')
    click_choice(page, '直接开战')
    check(page.locator('#view-combat').is_visible(), '最终战开战')
    page.screenshot(path=os.path.join(SHOT, '10_final_boss.png'))
    page.evaluate('autoBattle()'); page.wait_for_timeout(500)
    check(page.evaluate('pickFirstReward()'), '最终战胜利')
    page.wait_for_timeout(300)
    scene = page.evaluate('G.state.scene')
    check(scene == 'ending_dark', '进入结局·新王 (scene=' + scene + ')')
    page.wait_for_timeout(100)
    page.evaluate('document.getElementById("scene-text").onclick()')
    page.wait_for_timeout(100)
    body = page.evaluate('document.getElementById("scene-text").textContent')
    check('新守塔人' in body, '结局文本正确')
    check(not page.evaluate('!!localStorage.getItem("starfall_rpg_save_v1")'), '结局清档')
    page.screenshot(path=os.path.join(SHOT, '11_ending_dark.png'))

    # ================= 3. 光明结局重定向 =================
    print('== 光明结局重定向 ==')
    page.evaluate('G.state = newGameState("mage"); G.state.flags.core = "pure"; G.state.flags.minerSaved = true;')
    goto_scene(page, 'morgan_win')
    scene = page.evaluate('G.state.scene')
    check(scene == 'ending_light', '净化路线重定向 ending_light')
    body = page.evaluate('document.getElementById("scene-text").textContent')
    check('托马斯' in body and '星光' in body, '光明结局含支线回响')

    # ================= 4. 死亡与复活 =================
    print('== 死亡与复活 ==')
    page.evaluate('''() => {
        G.state = newGameState("warrior");
        G.state.scene = "town";
        G.state.player.hp = 1; G.state.player.maxHp = 10;
        Save.write(G.state);
    }''')
    goto_scene(page, 'prologue')
    click_choice(page, '迎战')
    page.wait_for_timeout(300)
    page.evaluate('G.state.player.hp = 1; Combat.C.enemies[0].hp = 999;')
    page.evaluate('Combat.C.enemies[0].intent = DATA.ENEMIES.goblin.moves[0];')  # 强制为攻击"挥砍"
    page.evaluate('Combat.endTurn()')
    page.wait_for_timeout(2500)
    check(page.locator('#view-death').is_visible(), '战败画面出现')
    page.screenshot(path=os.path.join(SHOT, '12_death.png'))
    page.click('#d-retry')
    page.wait_for_timeout(400)
    check(page.evaluate('G.state.scene') == 'prologue', '从检查点复活')

    browser.close()

print('')
if errors:
    print('✗ 深度测试失败 %d 项:' % len(errors))
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ 深度测试全部通过')
