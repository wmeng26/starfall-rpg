'use strict';
/* ============================================================
   星坠之谜 — 存档健壮性 / 回归校验
   用法: node tools/save_test.js

   覆盖 tools/validate.js 未涉及的场景：
   存档自愈（失效卡牌/装备/物品/场景/任务）、边界数值补全、
   战斗引擎的回合边界（重洗牌、状态递减、放弃战斗），
   以及剧情引擎的求值顺序（文本先于 onEnter）。
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const readJs = (f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const ALL_JS = ['data.js', 'state.js', 'ui.js', 'story.js', 'combat.js'].map(readJs).join('\n');

let failed = 0;
const check = (cond, msg) => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + msg);
  if (!cond) failed++;
};

/* ---------- 无 DOM 沙盒 ---------- */
const fakeEl = () => ({
  innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false,
  classList: { add() {}, remove() {} },
  appendChild() {}, remove() {}, onclick: null, disabled: false,
  addEventListener() {},
  querySelector: () => fakeEl(), querySelectorAll: () => [],
  children: [], firstChild: null, scrollTop: 0, scrollHeight: 0,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
});
const store = {};
const sb = new Function('document', 'window', 'localStorage', 'Main',
  ALL_JS + '\n;return { G, Combat, UI, Save, newGameState, DATA, gearBonus, checkMod, applyEffects, useItemOutside, xpNeeded };'
)(
  {
    querySelector: () => fakeEl(), querySelectorAll: () => [], createElement: () => fakeEl(),
    getElementById: () => fakeEl(), addEventListener() {}, body: fakeEl(),
  },
  { addEventListener() {}, AudioContext: null },
  {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  },
  { showDeath() {}, showTitle() {} }
);
const { G, Combat, UI, Save, newGameState, DATA, gearBonus, checkMod, applyEffects, useItemOutside, xpNeeded } = sb;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* 临时静音 UI 输出，避免刷屏 */
async function quiet(ms) {
  const t = UI.toast, l = UI.log;
  UI.toast = () => {}; UI.log = () => {};
  await sleep(ms);
  UI.toast = t; UI.log = l;
}
const putSave = (obj) => { store['starfall_rpg_save_v1'] = JSON.stringify(obj); };
const baseSave = () => JSON.parse(JSON.stringify(newGameState('warrior')));

async function main() {
  console.log('== 存档自愈 ==');

  /* 1. 失效卡牌被剔除，其余保留 */
  {
    const st = baseSave();
    st.deck.push('CARD_GONE', 'strike');
    putSave(st);
    const r = Save.read();
    check(!!r, '含失效卡牌的存档仍可读取');
    check(!r.deck.includes('CARD_GONE'), '失效卡牌已被剔除');
    check(r.deck.filter((c) => c === 'strike').length === 6, '同名有效卡牌全部保留（打击 ×6）');
    check(r.repaired.some((m) => m.includes('CARD_GONE')), '自愈记录包含失效卡牌');
  }

  /* 2. 牌组全部失效时回退为该职业初始牌组 */
  {
    const st = baseSave();
    st.deck = ['GONE_A', 'GONE_B'];
    putSave(st);
    const r = Save.read();
    check(r.deck.length === DATA.CLASSES.warrior.deck.length, '牌组清空后回退为初始牌组（' + r.deck.length + ' 张）');
    check(r.deck.every((c) => DATA.CARDS[c]), '回退后的牌组全部有效');
  }

  /* 3. 失效/错位装备被清空 */
  {
    const st = baseSave();
    st.player.gear.weapon = 'GEAR_GONE';
    st.player.gear.armor = 'iron_sword';   /* 武器放进护甲槽 */
    putSave(st);
    const r = Save.read();
    check(!r.player.gear.weapon, '失效武器已清空');
    check(!r.player.gear.armor, '槽位错位的装备已清空');
    check(gearBonus(r).atk === 0, '清理后装备加成为 0');
  }

  /* 4. 失效物品被清空，有效物品保留 */
  {
    const st = baseSave();
    st.items = { ITEM_GONE: 2, potion: 3, firebomb: 0 };
    putSave(st);
    const r = Save.read();
    check(!('ITEM_GONE' in r.items), '失效物品已清空');
    check(r.items.potion === 3, '有效物品保留（药水 ×3）');
    check(!('firebomb' in r.items), '数量为 0 的物品已清空');
  }

  /* 5. 失效场景回退序章 */
  {
    const st = baseSave();
    st.scene = 'SCENE_GONE';
    putSave(st);
    const r = Save.read();
    check(r.scene === 'prologue', '失效场景回退为序章');
  }

  /* 6. 失效任务/笔记被过滤 */
  {
    const st = baseSave();
    st.journal.quests = [{ id: 'main_mine', status: 'active' }, { id: 'QUEST_GONE', status: 'active' }];
    st.journal.notes = [{ id: 'night_star' }, { id: 'NOTE_GONE' }];
    putSave(st);
    const r = Save.read();
    check(r.journal.quests.length === 1 && r.journal.quests[0].id === 'main_mine', '失效任务已过滤');
    check(r.journal.notes.length === 1 && r.journal.notes[0].id === 'night_star', '失效笔记已过滤');
  }

  /* 7. 旧存档缺字段被补齐 */
  {
    const st = baseSave();
    delete st.journal; delete st.flags; delete st.stats; delete st.player.stats;
    putSave(st);
    const r = Save.read();
    check(r.journal && Array.isArray(r.journal.quests) && Array.isArray(r.journal.notes), '缺失的 journal 已补齐');
    check(r.flags && typeof r.flags === 'object', '缺失的 flags 已补齐');
    check(r.stats && typeof r.stats.battles === 'number', '缺失的统计已补齐');
    check(r.player.stats && typeof r.player.stats.pow === 'number', '缺失的属性已补齐');
  }

  /* 8. 非法数值被纠正 */
  {
    const st = baseSave();
    st.player.gold = NaN;
    st.player.level = 0;
    st.player.maxHp = 0;
    st.player.hp = -5;
    putSave(st);
    const r = Save.read();
    check(r.player.gold === 0, '金币 NaN 归零');
    check(r.player.level === 1, '等级 0 修正为 1');
    check(r.player.maxHp >= 1, '生命上限 0 修正为 ' + r.player.maxHp);
    check(r.player.hp === r.player.maxHp, '负生命修正为满血');
  }

  /* 9. 生命超过上限被夹紧 */
  {
    const st = baseSave();
    st.player.hp = st.player.maxHp + 500;
    putSave(st);
    check(Save.read().player.hp === st.player.maxHp, '超出上限的生命被夹紧');
  }

  /* 10. 完全损坏的存档返回 null 而非抛错 */
  {
    store['starfall_rpg_save_v1'] = '{ 这不是 JSON';
    check(Save.read() === null, '非 JSON 存档返回 null');
    putSave({ hello: 'world' });
    check(Save.read() === null, '缺少 player/scene 的存档返回 null');
    store['starfall_rpg_save_v1'] = 'null';
    check(Save.read() === null, '"null" 存档返回 null');
    delete store['starfall_rpg_save_v1'];
    check(Save.read() === null, '无存档时返回 null');
  }

  /* 11. 自愈后 UI 不再崩溃（回归：曾抛 TypeError） */
  {
    const st = baseSave();
    st.deck.push('CARD_GONE');
    st.player.gear.charm = 'GEAR_GONE';
    st.items = { ITEM_GONE: 1, potion: 1 };
    putSave(st);
    G.state = Save.read();
    let crashed = null;
    try { UI.deckModal(); UI.renderChar(); UI.journalModal(); }
    catch (e) { crashed = e.constructor.name + ': ' + e.message; }
    check(!crashed, '自愈后 牌组/角色面板/笔记 弹窗不再抛错' + (crashed ? ' → ' + crashed : ''));
  }

  /* 12. 正常存档不被误改 */
  {
    const st = baseSave();
    st.player.gold = 123; st.deck.push('pierce'); st.items.potion = 5;
    putSave(st);
    const r = Save.read();
    check(r.repaired.length === 0, '正常存档不产生自愈记录');
    check(r.player.gold === 123 && r.deck.includes('pierce') && r.items.potion === 5, '正常存档内容完整保留');
    check(r.deck.length === DATA.CLASSES.warrior.deck.length + 1, '正常存档牌组数量不变');
  }

  console.log('== 战斗回合边界 ==');

  /* 13. 抽牌堆耗尽时重洗弃牌堆 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    C.hand = []; C.draw = []; C.discard = ['strike', 'strike', 'strike'];
    Combat.drawCards(2);
    check(C.hand.length === 2, '空抽牌堆 + 弃牌堆重洗后抽到 2 张');
    check(C.discard.length === 0 && C.draw.length === 1, '重洗后堆数正确（弃牌 0 / 抽牌 1）');
    Combat.C = null;
  }

  /* 14. 手牌上限 10 张 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    C.hand = []; C.draw = new Array(30).fill('strike'); C.discard = [];
    Combat.drawCards(20);
    check(C.hand.length === 10, '连续抽 20 张时手牌封顶 10 张');
    Combat.C = null;
  }

  /* 15. 未出的手牌不跨回合保留（弃牌堆回收） */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    const leftover = C.hand.length;
    C.enemies[0].intent = { name: '戒备', block: 5 };
    await quiet(200);
    await Combat.endTurn();
    await quiet(200);
    check(Combat.C.hand.length === 5, '新回合手牌为 5 张（上回合剩余 ' + leftover + ' 张已弃置）');
    check(Combat.C.energy === Combat.C.maxEnergy, '行动力重置为 ' + Combat.C.energy);
    Combat.C = null;
  }

  /* 16. 易伤随敌人行动递减 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    const e = C.enemies[0];
    e.hp = 999; e.maxHp = 999;
    C.hand = ['dead_mark']; C.energy = 3;
    await Combat.playCard(0, e.uid);
    check(e.statuses.vuln === 2, '致命标记施加 2 层易伤');
    e.intent = { name: '戒备', block: 5 };
    await quiet(300);
    await Combat.endTurn();
    await quiet(300);
    check(e.statuses.vuln === 1, '敌人行动一次后易伤递减为 1');
    Combat.C = null;
  }

  /* 17. 护甲在小回合间清零 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    C.hand = ['defend']; C.energy = 3;
    await Combat.playCard(0, null);
    check(C.player.block === 5 + gearBonus(G.state).def, '防御获得护甲（含装备加成）= ' + C.player.block);
    C.enemies[0].intent = { name: '戒备', block: 5 };
    await quiet(300);
    await Combat.endTurn();
    await quiet(300);
    check(Combat.C.player.block === 0, '新回合护甲清零');
    Combat.C = null;
  }

  /* 18. 致命一击后正常进入胜利结算 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblin_scout', 'town');
    const C = Combat.C;
    C.busy = false;
    C.enemies[0].hp = 1;
    C.hand = ['strike']; C.energy = 3;
    await Combat.playCard(0, C.enemies[0].uid);
    await quiet(900);
    check(Combat.C && Combat.C.over === true && !!Combat.C.rewards, '击杀最后一名敌人后进入胜利结算');
    Combat.C = null;
  }

  /* 19. 放弃战斗后遗留的异步回合不抛错 */
  {
    G.state = newGameState('warrior');
    Combat.start('goblins2', 'town');
    const pending = Combat.endTurn();
    await sleep(430);
    Combat.abandon();
    let crashed = null;
    try { await pending; } catch (e) { crashed = e.constructor.name + ': ' + e.message; }
    await sleep(500);
    check(!crashed, 'abandon() 后遗留异步回合安全退出' + (crashed ? ' → ' + crashed : ''));
    check(Combat.C === null, 'abandon() 后战斗状态已释放');
  }

  console.log('== 数值与成长 ==');

  /* 20. 检定加值含饰品 */
  {
    G.state = newGameState('warrior');
    const base = checkMod(G.state, 'pow');
    G.state.player.gear.charm = 'amulet_pow';
    check(checkMod(G.state, 'pow') === base + 2, '力量护符使检定加值 ' + base + ' → ' + (base + 2));
  }

  /* 21. 治疗不溢出、满血用药不浪费 */
  {
    G.state = newGameState('warrior');
    G.state.player.hp = G.state.player.maxHp - 3;
    applyEffects(G.state, { healPct: 100 });
    check(G.state.player.hp === G.state.player.maxHp, '治疗不会超过生命上限');
    G.state.items.potion = 1;
    const ok = useItemOutside(G.state, 'potion');
    check(ok === false && G.state.items.potion === 1, '满血时使用药水被拒绝且不消耗');
  }

  /* 22. 扣款不会变成负数 */
  {
    G.state = newGameState('warrior');
    G.state.player.gold = 10;
    applyEffects(G.state, { gold: -999 });
    check(G.state.player.gold === 0, '扣款超过持有金币时归零而非负数');
  }

  /* 23. 升级与经验溢出 */
  {
    G.state = newGameState('warrior');
    applyEffects(G.state, { xp: 100000 });
    check(G.state.player.level > 1, '大量经验可连续升级至 Lv.' + G.state.player.level);
    check(G.state.player.xp < xpNeeded(G.state.player.level), '溢出经验被正确扣减');
  }

  console.log('== 剧情引擎求值顺序 ==');

  /* 24. 场景文本必须在 onEnter 之前求值
     否则"首次到访 / 再次到访"这类分支永远读到已被 onEnter 改写的状态 */
  {
    const seen = {};
    const hooks = {
      showView() {}, renderChar() {}, renderHud() {},
      typewriter(elem, text) { seen.text = text; },
      toast() {}, log() {},
    };
    /* 用 with 注入替身，避免与源码里的 const UI / const Save 重复声明 */
    const probe = new Function('__hooks', 'document', 'window', 'localStorage', 'Main',
      'with (__hooks) {\n' + ALL_JS + '\nreturn { G, Story, DATA, newGameState }; }'
    )(
      hooks,
      { querySelector: () => fakeEl(), querySelectorAll: () => [], createElement: () => fakeEl(),
        getElementById: () => fakeEl(), addEventListener() {}, body: fakeEl() },
      { addEventListener() {}, AudioContext: null },
      { getItem: () => null, setItem() {}, removeItem() {} },
      { showDeath() {}, showTitle() {} }
    );
    probe.G.state = probe.newGameState('warrior');
    probe.DATA.SCENES.__probe = {
      text: (s) => { seen.flagWhenTextRan = !!s.flags.probeVisited; return 'x'; },
      onEnter: (s) => { s.flags.probeVisited = true; },
      choices: [],
    };
    probe.Story.goto('__probe');
    check(seen.flagWhenTextRan === false, 'onEnter 的写入不会影响本次场景文本');
    check(probe.G.state.flags.probeVisited === true, 'onEnter 仍然正常执行');
    delete probe.DATA.SCENES.__probe;
  }

  /* 25. 铁匠铺的首次/再次文本取自"进入前"的状态 */
  {
    const s = DATA.SCENES.smith;
    check(typeof s.text === 'function', '铁匠铺文本为函数（带首次/再次分支）');
    check(s.text({ flags: {} }).indexOf('第七个') >= 0, '首次进入显示初访文本');
    check(s.text({ flags: { inSmith: true } }).indexOf('又来了') >= 0, '再次进入显示回头客文本');
  }

  /* ---------- 汇总 ---------- */
  console.log('');
  if (failed) { console.error('✗ 存档/回归校验失败 ' + failed + ' 项'); process.exit(1); }
  console.log('✓ 存档自愈 / 战斗边界 / 剧情求值顺序 校验全部通过（25 组）');
  process.exit(0);
}

main().catch((e) => { console.error('校验脚本自身出错:', e); process.exit(2); });
