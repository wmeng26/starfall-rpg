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
      for (let j = 0; j < 20; j++) {
        if (!(G.state && G.state.scene === 'blessing')) break;
        const btns = document.querySelectorAll('#choices .choice-btn');
        if (btns.length) btns[btns.length - 1].click();
        await new Promise(r => setTimeout(r, 150));
      }
      return true;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
};
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
    page.evaluate('dismissBlessings()')

def click_choice(page, text):
    page.locator('#choices .choice-btn', has_text=text).first.click()
    page.wait_for_timeout(200)
    page.evaluate('document.querySelector("#scene-text").onclick && document.querySelector("#scene-text").onclick()')
    page.wait_for_timeout(100)
    page.evaluate('dismissBlessings()')

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
    page.click('#scene-text')  # 跳过难度场景文字
    page.locator('#choices .choice-btn', has_text='磨砺').click()
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
    # —— 铃语斋（镇内新设施）——
    goto_scene(page, 'chimes')
    check('一只都不响' in page.evaluate('document.getElementById("scene-text").textContent'), '铃语斋初访文本')
    gold0 = page.evaluate('G.state.player.gold')
    click_choice(page, '清铃音')
    check(page.evaluate('G.state.deck.includes("chime")') and page.evaluate('G.state.player.gold') == gold0 - 70, '购得【清铃音】并扣款 70')
    click_choice(page, '银铃舌')
    check(page.evaluate('G.state.relics.includes("silver_tongue")'), '购得遗物·银铃舌')
    check(page.evaluate('document.querySelectorAll("#charpanel .relic-icon").length >= 1'), '角色面板出现遗物栏')
    click_choice(page, '风铃的来历')
    check(page.evaluate('G.state.journal.notes.some(n => n.id === "chime_lore")'), '风铃的来历已入笔记')
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
    check(page.evaluate('G.state.relics.includes("wolf_whistle")'), '狼群树洞获得遗物·狼骨哨')
    click_choice(page, '矿坑入口')
    check(page.evaluate('G.state.scene') == 'mine_entrance', '抵达矿坑入口')
    click_choice(page, '深入矿坑')
    # —— 第七巷（可选支线）——
    click_choice(page, '第七巷')
    check(page.evaluate('G.state.scene') == 'seventh_tunnel', '进入第七巷')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "side_wall" && q.status === "active")'), '支线「墙中的心跳」已记录')
    click_choice(page, '劈开搏动的墙')
    page.evaluate('autoBattle()'); page.wait_for_timeout(300)
    check(page.evaluate('pickFirstReward()'), '墙内伏击战胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'seventh_heart', '抵达墙后洞窟')
    click_choice(page, '收拢六人的遗物')
    check(page.evaluate('G.state.items.big_potion') == 1, '六人遗物中有大治疗药水')
    check(page.evaluate('G.state.relics.includes("keeper_monocle")'), '六人遗物中有守塔人的单片镜')
    click_choice(page, '面对墙中之物')
    check(page.locator('#view-combat').is_visible(), '头目战·墙中之物开战')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '墙中之物战胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.deck.includes("echo_strike")'), '获得卡牌【六人斩】')
    check(page.evaluate('G.state.journal.quests.find(q => q.id === "side_wall").status') == 'done', '支线「墙中的心跳」已完成')
    click_choice(page, '返回矿坑一层')
    click_choice(page, '深入三层')
    click_choice(page, '决一死战')
    check(page.locator('#view-combat').is_visible(), '头目战·掘地虫开战')
    check(page.evaluate('document.querySelectorAll("#view-combat .relic-chip").length >= 1'), '战斗底栏亮出携带的遗物')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '头目胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'worm_win', '巨虫倒下过场')
    check(page.evaluate('G.state.relics.includes("worm_eye")'), '矿坑之王掉落遗物·王虫的独眼')
    check(page.evaluate('G.state.relics.length') >= 4, '遗物持有数 ≥ 4（当前 %d）' % page.evaluate('G.state.relics.length'))
    check(page.evaluate('Achieve.has("relic_hunter")'), '成就「星尘收藏家」已解锁')
    check(page.evaluate('G.state.journal.quests.find(q => q.id === "main_mine").status') == 'done', '矿坑主线已完成')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "main_tower" && q.status === "active")'), '古塔主线已开启')
    click_choice(page, '冲回地面')
    check(page.evaluate('G.state.scene') == 'core_choice', '星核抉择场景')
    click_choice(page, '吸收它的力量')
    click_choice(page, '我要亲手终结')
    check(page.evaluate('G.state.scene') == 'rift_gate', '进入坠星裂谷（星核抉择后的新增章节）')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "main_rift" && q.status === "active")'), '裂谷主线已开启')
    page.evaluate('G.state.player.hp = G.state.player.maxHp')
    click_choice(page, '迎着塔影下行')
    click_choice(page, '拔剑')
    check(page.locator('#view-combat').is_visible(), '头目战·影之先驱开战')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '先驱战胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'herald_win', '影之先驱溃散过场')
    check(page.evaluate('G.state.relics.includes("ember_heart")'), '先驱掉落遗物·烬心炉')
    check(page.evaluate('G.state.journal.quests.find(q => q.id === "main_rift").status') == 'done', '裂谷主线已完成')
    check(page.evaluate('Achieve.has("herald_slain")'), '成就「门前的先驱」已解锁')
    click_choice(page, '直抵塔下营地')
    check(page.evaluate('G.state.scene') == 'tower_gate', '抵达古塔下（神秘旅人）')
    check(page.evaluate('G.state.deck.includes("shadow_rage")'), '获得影之怒')
    click_choice(page, '踏入古塔')
    check(page.evaluate('G.state.scene') == 'tower_hall', '踏入古塔——塔底大厅')
    page.screenshot(path=os.path.join(SHOT, '14_tower_hall.png'))
    click_choice(page, '守塔人的遗物')
    check(page.evaluate('G.state.items.antidote') == 1, '大厅搜出解毒草（+25 金币）')
    check(page.evaluate('G.state.relics.includes("map_shard")'), '壁龛藏有遗物·星图残页')
    goto_scene(page, 'tower_archive')
    click_choice(page, '研读守塔人的手记')
    check(page.evaluate('G.state.journal.notes.some(n => n.id === "keeper_journal")'), '守塔人的手记已入笔记')
    page.evaluate('G.state.player.stats.int = 30')
    click_choice(page, '校准星轨罗盘')
    click_choice(page, '继续')
    check(page.evaluate('G.state.deck.includes("meteor")'), '罗盘校准获得【陨星术】')
    click_choice(page, '回到塔底大厅')
    click_choice(page, '沿旋梯而上')
    check(page.evaluate('G.state.scene') == 'tower_stairs', '星轨旋梯有星影把守')
    click_choice(page, '斩碎星影')
    page.evaluate('autoBattle()'); page.wait_for_timeout(300)
    check(page.evaluate('pickFirstReward()'), '星影清剿胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'tower_landing', '抵达旋梯中段')
    page.evaluate('G.state.player.hp = 100')
    click_choice(page, '星尘泉水')
    check(page.evaluate('G.state.player.hp === Math.min(G.state.player.maxHp, 100 + Math.round(G.state.player.maxHp*0.6))'), '星尘泉水恢复 60% 生命')
    click_choice(page, '对上凹室的星轨石像')
    check(page.locator('#view-combat').is_visible(), '精英战·星轨石像开战')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '石像战胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.player.gear.weapon') == 'star_blade', '获得武器·星辉长剑')
    check(page.evaluate('G.state.relics.includes("hourglass")'), '石像胸腔藏有遗物·星辉沙漏')
    click_choice(page, '沿旋梯直上塔顶')
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
    achv = page.evaluate('JSON.parse(localStorage.getItem("starfall_rpg_achv_v1")||"[]")')
    check('ending_dark' in achv and 'worm_slain' in achv and 'first_win' in achv, '结局清档后成就仍保留（结局/头目/首胜）')

    # ================= 2.5 星陨林支线 =================
    print('== 星陨林支线 ==')
    page.evaluate('''() => {
        G.state = newGameState("warrior");
        const st = G.state;
        st.player.maxHp = 400; st.player.hp = 400; st.player.gold = 200; st.player.level = 4;
        st.deck = ['heavy_slash','heavy_slash','heavy_slash','iron_wall','whirlwind','first_aid'];
    }''')
    goto_scene(page, 'crossroads')
    click_choice(page, '猎人小径')
    check(page.evaluate('G.state.scene') == 'grove_path', '岔路口进入星陨林')
    page.screenshot(path=os.path.join(SHOT, '13_grove.png'))
    click_choice(page, '捣药声的小屋')
    check(page.evaluate('G.state.journal.quests.some(q => q.id === "side_grove" && q.status === "active")'), '药婆小屋接取支线「林心的异光」')
    click_choice(page, '接下委托')
    check(page.evaluate('G.state.scene') == 'grove_heart_pre', '抵达林心泉眼')
    click_choice(page, '听它说什么')
    check(page.evaluate('G.state.scene') == 'wisp_deal', '低语提出契约')
    click_choice(page, '泉底的，才是受害者')
    click_choice(page, '直接动手')
    check(page.locator('#view-combat').is_visible(), '精英战·林心低语者开战')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '精英战胜利领奖')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'wisp_win', '泉眼净化完成')
    check(page.evaluate('G.state.flags.springDone') == True, '净化标记 springDone 已写入')
    check(page.evaluate('G.state.deck.includes("star_dust")'), '获得卡牌【星屑飞尘】')
    check(page.evaluate('G.state.items.star_dew') == 1, '获得星辉露珠 ×1')
    check(page.evaluate('G.state.relics.includes("bone_flute")'), '泉底拾得遗物·低语的骨笛')
    check(page.evaluate('G.state.player.gear.charm') == 'star_speaker', '饰品空位时获得星语者徽记')
    check(page.evaluate('G.state.journal.quests.find(q => q.id === "side_grove").status') == 'done', '支线「林心的异光」已完成')
    click_choice(page, '回药婆小屋道谢')
    body = page.evaluate('document.getElementById("scene-text").textContent')
    check('泉水清了' in body, '药婆感谢文本（净化后回访分支）')
    goto_scene(page, 'grove_stag')
    click_choice(page, '猎下这副雾角')
    page.evaluate('autoBattle()'); page.wait_for_timeout(400)
    check(page.evaluate('pickFirstReward()'), '雾角鹿战斗胜利')
    page.wait_for_timeout(200)
    check(page.evaluate('G.state.scene') == 'stag_win' and page.evaluate('G.state.flags.stagLoot') == True, '雾角鹿战利品结算')
    check(page.evaluate('G.state.items.energy_potion') >= 1, '获得能量药水（战利品随机掉落可叠加）')
    # 契约分支：接受低语馈赠
    page.evaluate('G.state = newGameState("ranger"); G.state.scene = "wisp_deal";')
    goto_scene(page, 'wisp_deal')
    click_choice(page, '成交')
    check(page.evaluate('G.state.deck.includes("mist_pact")'), '契约分支获得【雾之契约】')
    check(page.evaluate('G.state.flags.wispDeal') == True and page.evaluate('G.state.journal.notes.some(n => n.id === "wisp_pact")'), '契约标记与笔记已记录')
    check(page.evaluate('G.state.flags.springDone ? false : true') == True, '接受契约不触发泉眼净化')
    check(page.evaluate('DATA.SCENES.ending_dark.text(Object.assign(newGameState("warrior"), {flags:{wispDeal:true, minerSaved:true}})).includes("低语")'), '新王结局含契约回响')
    check(page.evaluate('DATA.SCENES.ending_peace.text(Object.assign(newGameState("warrior"), {flags:{wispDeal:true}})).includes("低语")'), '长夜结局含契约回响')

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

    # ================= 5. 回归：满血休息禁用 & 剧情致死结算 =================
    print('== 回归修正 ==')
    page.evaluate('''() => {
        G.state = newGameState("warrior");
        G.state.scene = "town";
        Save.write(G.state);
    }''')
    goto_scene(page, 'town')
    rest = page.evaluate('''() => {
        const b = [...document.querySelectorAll('#choices .choice-btn')].find(x => x.textContent.includes('客栈歇脚'));
        return b ? { disabled: b.disabled, text: b.textContent } : null;
    }''')
    check(rest is not None and rest['disabled'] is True, '满血时客栈歇脚按钮禁用')
    check(rest is not None and '无需休息' in rest['text'], '满血休息提示文案显示')

    page.evaluate('''() => {
        G.state = newGameState("warrior");
        G.state.player.stats.agi = -10;   /* 检定必败 */
        G.state.player.hp = 6;
        G.state.scene = "forest";
        Save.write(G.state);
    }''')
    goto_scene(page, 'forest')
    click_choice(page, '轻步穿行')
    page.wait_for_timeout(1200)
    check(page.locator('#view-death').is_visible(), '检定失败扣血至 0 触发死亡结算')
    page.click('#d-retry')
    page.wait_for_timeout(400)
    check(page.evaluate('G.state.scene') == 'forest', '复活回到检查点场景')
    check(page.evaluate('G.state.player.hp') == 6, '复活恢复检查点生命')

    # ================= 6. 回归：战斗中面板禁用药水 & 移动端抽屉 =================
    print('== 面板物品与移动端 ==')
    page.evaluate('G.state = newGameState("warrior"); Combat.start("goblin_scout", "town");')
    page.wait_for_timeout(400)
    check(page.evaluate('document.querySelectorAll("#charpanel .item-use").length') == 0, '战斗中面板不显示物品使用按钮')
    check(page.evaluate('document.querySelectorAll("#view-combat .itembtn").length') > 0, '战斗物品栏可用')
    page.evaluate('Combat.abandon(); G.state = null;')

    page.set_viewport_size({'width': 390, 'height': 844})
    page.wait_for_timeout(200)
    page.evaluate('''() => {
        G.state = newGameState("warrior");
        G.state.scene = "town";
        G.state.player.hp = 40;
        Save.write(G.state);
    }''')
    goto_scene(page, 'town')
    check(page.evaluate('!document.getElementById("btn-panel").disabled'), '游戏中面板按钮可用')
    box = page.locator('#charpanel').bounding_box()
    check(box is not None and box['x'] < 0, '移动端面板默认收起在屏外')
    page.click('#btn-panel')
    page.wait_for_timeout(400)
    box = page.locator('#charpanel').bounding_box()
    check(box is not None and box['x'] <= 2, '点击按钮面板滑出')
    use_btn = page.locator('#charpanel .item-use[data-item="potion"]')
    check(use_btn.count() > 0, '抽屉内治疗药水可点击')
    before_hp = page.evaluate('G.state.player.hp')
    use_btn.first.click()
    page.wait_for_timeout(250)
    check(page.evaluate('G.state.player.hp') == before_hp + 25, '抽屉内使用药水生效 (%d→%d)' % (before_hp, before_hp + 25))
    page.click('#panel-mask', position={'x': 370, 'y': 400})
    page.wait_for_timeout(400)
    box = page.locator('#charpanel').bounding_box()
    check(box is not None and box['x'] < 0, '点遮罩收回面板')
    page.set_viewport_size({'width': 1280, 'height': 860})

    # ================= 7. 成就图鉴 =================
    print('== 成就图鉴 ==')
    page.evaluate('Main.showTitle()')
    page.wait_for_timeout(300)
    check(page.evaluate('!!document.getElementById("t-achv")'), '标题画面有成就图鉴按钮')
    achv_n = page.evaluate('Achieve.count()')
    check(achv_n >= 3, '已解锁成就数 ≥ 3（当前 %d）' % achv_n)
    page.click('#t-achv')
    page.wait_for_timeout(300)
    mt = page.locator('.modal-box .modal-title').inner_text()
    check('成就' in mt.replace(' ', ''), '成就图鉴弹窗打开: ' + mt)
    body = page.locator('.modal-box .modal-body').inner_text()
    check('矿坑之王' in body and '结局 · 新王' in body and '？？？' in body, '图鉴含已解锁与未解锁条目')
    page.screenshot(path=os.path.join(SHOT, '15_achievements.png'))
    page.locator('.modal-close').click()
    page.wait_for_timeout(200)

    browser.close()

print('')
if errors:
    print('✗ 深度测试失败 %d 项:' % len(errors))
    for e in errors:
        print('  - ' + e)
    sys.exit(1)
print('✓ 深度测试全部通过')
