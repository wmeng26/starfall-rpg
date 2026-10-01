'use strict';
/* ============================================================
   数据一致性校验：node tools/validate.js
   检查语法 + 所有 ID 引用（卡牌/装备/物品/敌群/场景跳转）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let errors = 0;
const err = (msg) => { console.error('  ✗ ' + msg); errors++; };

/* ---------- 1. 语法检查 ---------- */
console.log('== 语法检查 ==');
for (const f of ['data.js', 'state.js', 'ui.js', 'story.js', 'combat.js', 'main.js']) {
  const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
  try { new Function(src); console.log('  ✓ js/' + f); }
  catch (e) { err('js/' + f + ' 语法错误: ' + e.message); }
}
if (errors) process.exit(1);

/* ---------- 2. 载入数据 ---------- */
const dataSrc = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
const stateSrc = fs.readFileSync(path.join(ROOT, 'js', 'state.js'), 'utf8');
const DATA = new Function(dataSrc + '\n;return DATA;')();

/* 带 UI 桩的沙盒，测试角色/效果逻辑 */
const sandbox = new Function(
  'const UI={log(){},toast(){}};const Sfx={play(){}};\n' + dataSrc + '\n' + stateSrc +
  '\n;return { DATA, newGameState, applyEffects, gainXp, gearBonus, effStat, xpNeeded, Quest, Note, hasRelic, relicSum, checkMod, Codex };'
)();

console.log('== 数据引用检查 ==');

const CARDS = DATA.CARDS, ITEMS = DATA.ITEMS, GEAR = DATA.GEAR,
      ENEMIES = DATA.ENEMIES, GROUPS = DATA.GROUPS, ENC = DATA.ENCOUNTERS,
      SCENES = DATA.SCENES, CLASSES = DATA.CLASSES;

/* 职业 */
for (const cid in CLASSES) {
  const c = CLASSES[cid];
  for (const card of c.deck) if (!CARDS[card]) err('职业 ' + cid + ' 牌组含未知卡牌 ' + card);
  for (const slot in c.gear) {
    const gid = c.gear[slot];
    if (gid && !GEAR[gid]) err('职业 ' + cid + ' 初始装备未知: ' + gid);
  }
  for (const k of ['pow', 'agi', 'int', 'cha']) if (typeof c.stats[k] !== 'number') err('职业 ' + cid + ' 缺少属性 ' + k);
}

/* 卡牌 */
const FX_KEYS = ['dmg', 'times', 'dmgAll', 'block', 'heal', 'hp', 'draw', 'energy', 'cleanse', 'statusEnemy', 'statusAllEnemy', 'statusSelf', 'special'];
const STATUSES = ['poison', 'weak', 'vuln', 'strength'];
for (const id in CARDS) {
  const c = CARDS[id];
  if (c.id !== id) err('卡牌 id 不一致: ' + id);
  if (!['attack', 'skill', 'power'].includes(c.type)) err('卡牌 ' + id + ' 类型非法: ' + c.type);
  if (!['enemy', 'all', 'self'].includes(c.target)) err('卡牌 ' + id + ' 目标非法: ' + c.target);
  if (c.cls && !CLASSES[c.cls]) err('卡牌 ' + id + ' 未知职业: ' + c.cls);
  for (const k in c.fx) if (!FX_KEYS.includes(k)) err('卡牌 ' + id + ' 未知 fx 字段: ' + k);
  for (const k of ['statusEnemy', 'statusAllEnemy', 'statusSelf']) {
    if (c.fx[k]) for (const s in c.fx[k]) if (!STATUSES.includes(s)) err('卡牌 ' + id + ' 未知状态: ' + s);
  }
}

/* 敌人与敌群 */
for (const id in ENEMIES) {
  const e = ENEMIES[id];
  if (!e.moves || !e.moves.length) err('敌人 ' + id + ' 无行动');
  for (const m of e.moves) {
    for (const k of ['self', 'toPlayer']) {
      if (m[k]) for (const s in m[k]) if (!STATUSES.includes(s)) err('敌人 ' + id + ' 行动 ' + m.name + ' 未知状态: ' + s);
    }
  }
}
for (const g in GROUPS) {
  for (const e of GROUPS[g]) if (!ENEMIES[e]) err('敌群 ' + g + ' 含未知敌人 ' + e);
}
for (const p in ENC) {
  for (const g of ENC[p]) if (!GROUPS[g]) err('遭遇池 ' + p + ' 含未知敌群 ' + g);
}

/* 物品与装备 */
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (it.use) for (const k in it.use) if (!['heal', 'dmg', 'energy', 'cleanse'].includes(k)) err('物品 ' + id + ' 未知使用效果: ' + k);
}
for (const id in GEAR) {
  const g = GEAR[id];
  if (!['weapon', 'armor', 'charm'].includes(g.slot)) err('装备 ' + id + ' 槽位非法: ' + g.slot);
  if (g.stat && !['pow', 'agi', 'int', 'cha'].includes(g.stat)) err('装备 ' + id + ' 未知属性加成');
}

/* 遗物 */
const RELICS = DATA.RELICS;
const RELIC_KEYS = ['startBlock', 'startStrength', 'enemyVuln', 'startLossHp', 'maxEnergy', 'energyFirst',
                    'drawFirst', 'turnHeal', 'poisonPlus', 'thorns', 'winHeal', 'goldPct', 'xpPct', 'check'];
for (const id in RELICS) {
  const r = RELICS[id];
  if (r.id !== id) err('遗物 id 不一致: ' + id);
  if (!r.name || !r.icon || !r.desc) err('遗物 ' + id + ' 缺少名称/图标/描述');
  let effectCount = 0;
  for (const k in r) {
    if (['id', 'name', 'icon', 'desc'].includes(k)) continue;
    if (!RELIC_KEYS.includes(k)) err('遗物 ' + id + ' 未知效果字段: ' + k);
    else effectCount++;
  }
  if (!effectCount) err('遗物 ' + id + ' 没有任何效果');
  if (r.check) {
    if (!['pow', 'agi', 'int', 'cha'].includes(r.check.stat)) err('遗物 ' + id + ' 检定属性非法');
    if (typeof r.check.v !== 'number') err('遗物 ' + id + ' 检定加值非法');
  }
}
if (new Set(Object.values(RELICS).map((r) => r.name)).size !== Object.keys(RELICS).length) err('遗物名称重复');

/* 场景与跳转 */
const sceneIds = Object.keys(SCENES);
const checkScene = (from, id) => { if (id && !SCENES[id]) err('场景 ' + from + ' 跳转到未知场景: ' + id); };
const checkFx = (sid, fx, tag) => {
  if (!fx) return;
  if (fx.card && !CARDS[fx.card]) err('场景 ' + sid + ' ' + tag + 'fx.card 未知: ' + fx.card);
  if (fx.item && !ITEMS[fx.item]) err('场景 ' + sid + ' ' + tag + 'fx.item 未知: ' + fx.item);
  if (fx.useItem && !ITEMS[fx.useItem]) err('场景 ' + sid + ' ' + tag + 'fx.useItem 未知: ' + fx.useItem);
  if (fx.gear && !GEAR[fx.gear]) err('场景 ' + sid + ' ' + tag + 'fx.gear 未知: ' + fx.gear);
  if (fx.relic && !DATA.RELICS[fx.relic]) err('场景 ' + sid + ' ' + tag + 'fx.relic 未知: ' + fx.relic);
  if (fx.note && !DATA.NOTES[fx.note]) err('场景 ' + sid + ' ' + tag + 'fx.note 未知: ' + fx.note);
  if (fx.quest && !DATA.QUESTS[fx.quest]) err('场景 ' + sid + ' ' + tag + 'fx.quest 未知: ' + fx.quest);
  if (fx.questDone && !DATA.QUESTS[fx.questDone]) err('场景 ' + sid + ' ' + tag + 'fx.questDone 未知: ' + fx.questDone);
  if (fx.special && !['class_card'].includes(fx.special)) err('场景 ' + sid + ' ' + tag + 'fx.special 未知: ' + fx.special);
};
/* 场景函数内直接调用的 Quest.add / Note.add / Quest.done 字符串引用 */
const questRefRe = /(?:Quest|Note)\.(add|done)\(\s*s\s*,\s*['"]([\w]+)['"]\s*\)/g;
let m;
while ((m = questRefRe.exec(dataSrc)) !== null) {
  const [ , fn, id ] = m;
  const isNote = m[0].startsWith('Note');
  if (isNote) { if (!DATA.NOTES[id]) err('Note.add 未知笔记: ' + id); }
  else if (!DATA.QUESTS[id]) err('Quest.' + fn + ' 未知任务: ' + id);
}
/* 场景函数内 relics.push 的字面量引用 */
const relicPushRe = /relics\.push\(\s*['"]([\w]+)['"]\s*\)/g;
while ((m = relicPushRe.exec(dataSrc)) !== null) {
  if (!DATA.RELICS[m[1]]) err('relics.push 未知遗物: ' + m[1]);
}
for (const sid of sceneIds) {
  const sc = SCENES[sid];
  for (const ch of (sc.choices || [])) {
    checkScene(sid, ch.go);
    checkScene(sid, ch.win);
    if (ch.combat && ch.combat.indexOf('random:') !== 0 && !GROUPS[ch.combat]) err('场景 ' + sid + ' 战斗敌群未知: ' + ch.combat);
    if (ch.combat && ch.combat.indexOf('random:') === 0 && !ENC[ch.combat.slice(7)]) err('场景 ' + sid + ' 遭遇池未知: ' + ch.combat);
    if (ch.check && !['pow', 'agi', 'int', 'cha'].includes(ch.check.stat)) err('场景 ' + sid + ' 检定属性非法');
    if (ch.check && !ch.success && !ch.fail) err('场景 ' + sid + ' 检定选项缺少成功/失败分支');
    for (const br of ['success', 'fail']) {
      const b = ch[br];
      if (!b) continue;
      checkScene(sid, b.go);
      checkScene(sid, b.win);
      if (b.combat && !GROUPS[b.combat]) err('场景 ' + sid + ' 分支战斗敌群未知: ' + b.combat);
      checkFx(sid, b.fx, '分支');
    }
    checkFx(sid, ch.fx, '');
    if (ch.special && !['class', 'to_title'].includes(ch.special)) err('场景 ' + sid + ' special 未知: ' + ch.special);
    if (ch.special === 'class' && ch.cls && !CLASSES[ch.cls]) err('场景 ' + sid + ' 未知职业: ' + ch.cls);
  }
}
for (const cid in (DATA.CLASS_CARDS || {})) {
  if (!CARDS[DATA.CLASS_CARDS[cid]]) err('CLASS_CARDS[' + cid + '] 未知卡牌');
}

/* ---------- 3. 逻辑冒烟测试 ---------- */
console.log('== 逻辑冒烟测试 ==');
for (const cid in CLASSES) {
  const st = sandbox.newGameState(cid);
  if (st.player.hp !== st.player.maxHp) err(cid + ' 初始生命异常');
  const gb = sandbox.gearBonus(st);
  if (gb.atk !== 1) err(cid + ' 初始武器加成应为1, 实际 ' + gb.atk);
  const json = JSON.parse(JSON.stringify(st));
  if (json.player.cls !== cid) err(cid + ' 存档序列化失败');
  console.log('  ✓ 职业 ' + cid + '：HP ' + st.player.maxHp + ' · 牌组 ' + st.deck.length + ' 张');
}
/* 效果与升级 */
const st = sandbox.newGameState('warrior');
sandbox.applyEffects(st, { gold: -10, item: 'potion', card: 'pierce', gear: 'iron_sword', flag2: { core: 'pure' }, stat: { pow: 1 }, healPct: 50 });
if (st.player.gold !== 20) err('金币扣除错误: ' + st.player.gold);
if (st.items.potion !== 3) err('物品添加错误');
if (!st.deck.includes('pierce')) err('卡牌添加错误');
if (st.player.gear.weapon !== 'iron_sword') err('装备更换错误');
if (st.flags.core !== 'pure') err('flag2 设置错误');
sandbox.gainXp(st, 60);
if (st.player.level !== 2) err('升级错误: ' + st.player.level);
/* 任务与笔记 */
const st2 = sandbox.newGameState('mage');
sandbox.Quest.add(st2, 'main_mine');
sandbox.Quest.add(st2, 'main_mine');           /* 重复添加应去重 */
if (st2.journal.quests.length !== 1) err('任务去重失败');
sandbox.Quest.done(st2, 'main_mine');
if (st2.journal.quests[0].status !== 'done') err('任务完成状态错误');
sandbox.Note.add(st2, 'night_star');
sandbox.Note.add(st2, 'night_star');
if (st2.journal.notes.length !== 1) err('笔记去重失败');
sandbox.applyEffects(st2, { note: 'tavern_rumor' });
if (st2.journal.notes.length !== 2) err('fx.note 生效失败');
const jjson = JSON.parse(JSON.stringify(st2));
if (jjson.journal.notes.length !== 2) err('笔记序列化失败');
console.log('  ✓ 任务/笔记 记录 · 去重 · 序列化 通过');
console.log('  ✓ 效果结算 / 升级 / 序列化 通过');
/* 遗物：聚合 / 去重 / 检定加值 */
const st3 = sandbox.newGameState('ranger');
sandbox.applyEffects(st3, { relic: 'silver_tongue' });
sandbox.applyEffects(st3, { relic: 'silver_tongue' });   /* 重复获得应去重 */
if (st3.relics.length !== 1) err('遗物去重失败: ' + JSON.stringify(st3.relics));
st3.relics.push('worm_eye');
const rs = sandbox.relicSum(st3);
if (rs.startBlock !== 3) err('遗物 startBlock 聚合错误: ' + rs.startBlock);
if (rs.maxEnergy !== 1 || rs.startLossHp !== 3) err('遗物 boss 效果聚合错误: ' + JSON.stringify(rs));
if (!sandbox.hasRelic(st3, 'worm_eye') || sandbox.hasRelic(st3, 'watch')) err('hasRelic 判定失败');
const baseInt = sandbox.checkMod(st3, 'int');
st3.relics.push('keeper_monocle');
if (sandbox.checkMod(st3, 'int') !== baseInt + 3) err('单片镜智力检定加值失败: ' + sandbox.checkMod(st3, 'int'));
if (sandbox.checkMod(Object.assign({}, st3, { relics: [] }), 'cha') !== sandbox.checkMod(st3, 'cha')) err('遗物检定加值不应影响其他属性');
console.log('  ✓ 遗物 聚合 / 去重 / 检定加值 通过');
/* 图鉴：收录 / 去重 / 计数 */
const cod = sandbox.Codex;
const stc = sandbox.newGameState('warrior');
cod.markState(stc);
if (cod.count('cards') !== new Set(stc.deck).size) err('初始牌组收录数错误: ' + cod.count('cards'));
cod.mark('enemies', ['goblin', 'goblin', 'goblin_thug', 'ghost_dummy']);
if (cod.count('enemies') !== 2) err('敌人收录/去重失败: ' + cod.count('enemies'));
cod.markState({ deck: ['strike'], relics: ['silver_tongue'] });
if (cod.count('relics') !== 1) err('遗物收录失败: ' + cod.count('relics'));
if (cod.count() !== cod.count('cards') + cod.count('relics') + cod.count('enemies')) err('图鉴总数与分栏不一致');
if (cod.total() !== Object.keys(CARDS).length + Object.keys(RELICS).length + Object.keys(ENEMIES).length) err('图鉴 total 与数据不一致');
if (!cod.has('cards', 'strike') || cod.has('relics', 'watch')) err('Codex.has 判定失败');
/* 图鉴向成就的 test 可执行且类型正确（须在含 state.js 的沙盒里调，test 引用 Codex） */
for (const aid of ['codex_cards', 'codex_relics', 'codex_enemies']) {
  if (typeof sandbox.DATA.ACHIEVEMENTS[aid].test({}) !== 'boolean') err('成就 ' + aid + ' test 未返回布尔值');
}
console.log('  ✓ 图鉴 收录 / 去重 / 计数 通过');

/* ---------- 4. 战斗/死亡引擎冒烟（无 DOM 沙盒） ---------- */
const readJs = (f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
let deathCount = 0;
const fakeEl = () => ({
  innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false,
  classList: { add() {}, remove() {} },
  appendChild() {}, remove() {}, onclick: null, disabled: false,
  querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  children: [], firstChild: null, scrollTop: 0, scrollHeight: 0,
});
const combatSandbox = new Function('document', 'window', 'localStorage', 'Main',
  ['data.js', 'state.js', 'ui.js', 'story.js', 'combat.js'].map(readJs).join('\n') +
  '\n;return { G, Combat, Story, newGameState };'
)(
  { querySelector: () => fakeEl(), querySelectorAll: () => [], createElement: () => fakeEl(),
    getElementById: () => fakeEl(), addEventListener() {}, body: fakeEl() },
  { addEventListener() {}, AudioContext: null },
  { getItem: () => null, setItem() {}, removeItem() {} },
  { showDeath() { deathCount += 1; } }
);
const { G, Combat, Story, newGameState } = combatSandbox;

(async () => {
  console.log('== 战斗/死亡引擎冒烟 ==');

  /* 敌人在敌方回合被毒死：应立即结算胜利 */
  G.state = newGameState('warrior');
  Combat.start('goblin_scout', 'town');
  const c1 = Combat.C;
  c1.enemies[0].hp = 1;
  c1.enemies[0].statuses.poison = 3;
  c1.hand = []; c1.draw = []; c1.discard = [];
  await Combat.endTurn();
  if (!(Combat.C && Combat.C.over && Combat.C.rewards)) err('毒杀最后一个敌人未立即结算胜利');
  else console.log('  ✓ 毒杀最后一个敌人立即进入胜利结算');
  Combat.C = null;

  /* 剧情效果扣血至 0：应触发死亡结算 */
  G.state = newGameState('warrior');
  G.state.player.hp = 6;
  Story.choose({ fx: { hp: -8 } });
  await new Promise((r) => setTimeout(r, 950));
  if (deathCount !== 1) err('剧情扣血至 0 未触发死亡结算');
  else console.log('  ✓ 剧情扣血至 0 进入死亡结算');

  /* ---------- 汇总 ---------- */
  console.log('');
  if (errors) { console.error('✗ 发现 ' + errors + ' 个问题'); process.exit(1); }
  console.log('✓ 全部校验通过（场景 ' + sceneIds.length + ' · 卡牌 ' + Object.keys(CARDS).length + ' · 敌人 ' + Object.keys(ENEMIES).length + ' · 物品 ' + Object.keys(ITEMS).length + '）');
  process.exit(0);
})();
