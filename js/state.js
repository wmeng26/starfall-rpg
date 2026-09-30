'use strict';
/* ============================================================
   星坠之谜 — 存档 / 角色状态 / 效果结算
   ============================================================ */

const SAVE_KEY = 'starfall_rpg_save_v1';
const SOUND_KEY = 'starfall_rpg_sound';

const Save = {
  available() {
    try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; }
    catch (e) { return false; }
  },
  has() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },
  write(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  },
  read() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const st = JSON.parse(raw);
      if (!st || !st.player || !st.scene) return null;
      return repairSave(st);
    } catch (e) { return null; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  },
};

/* —— 存档自愈 ——
   版本更新后，旧存档里可能残留已被删除/改名的卡牌、装备、物品或场景 ID。
   这些悬空引用会让牌组弹窗、角色面板、奖励结算直接抛 TypeError，
   因此在读档时就地清理，并补齐缺失的字段。 */
function repairSave(st) {
  const CARDS = DATA.CARDS, GEAR = DATA.GEAR, ITEMS = DATA.ITEMS;
  const p = st.player;
  const dropped = [];
  st.repaired = dropped;

  if (!p.stats || typeof p.stats !== 'object') p.stats = { pow: 1, agi: 1, int: 1, cha: 1 };
  if (!p.gear || typeof p.gear !== 'object') p.gear = {};
  for (const slot of ['weapon', 'armor', 'charm']) {
    const id = p.gear[slot];
    if (id && (!GEAR[id] || GEAR[id].slot !== slot)) { delete p.gear[slot]; dropped.push('装备 ' + id); }
  }
  if (typeof p.gold !== 'number' || !isFinite(p.gold)) p.gold = 0;

  if (!Array.isArray(st.deck)) st.deck = [];
  for (let i = st.deck.length - 1; i >= 0; i--) {
    if (!CARDS[st.deck[i]]) { dropped.push('卡牌 ' + st.deck[i]); st.deck.splice(i, 1); }
  }
  if (!st.deck.length) {
    const c = DATA.CLASSES[p.cls];
    if (c && Array.isArray(c.deck)) st.deck.push.apply(st.deck, c.deck);
  }

  if (!Array.isArray(st.relics)) st.relics = [];
  for (let i = st.relics.length - 1; i >= 0; i--) {
    if (!DATA.RELICS[st.relics[i]]) { dropped.push('遗物 ' + st.relics[i]); st.relics.splice(i, 1); }
  }

  if (!st.items || typeof st.items !== 'object') st.items = {};
  for (const id in st.items) {
    if (!ITEMS[id] || typeof st.items[id] !== 'number' || st.items[id] <= 0) { delete st.items[id]; dropped.push('物品 ' + id); }
  }

  if (!st.flags || typeof st.flags !== 'object') st.flags = {};
  if (!st.journal || typeof st.journal !== 'object') st.journal = { quests: [], notes: [] };
  if (!Array.isArray(st.journal.quests)) st.journal.quests = [];
  if (!Array.isArray(st.journal.notes)) st.journal.notes = [];
  st.journal.quests = st.journal.quests.filter((q) => q && DATA.QUESTS[q.id]);
  st.journal.notes = st.journal.notes.filter((n) => n && DATA.NOTES[n.id]);
  if (!p.level || p.level < 1) p.level = 1;
  if (!st.stats || typeof st.stats !== 'object') st.stats = { battles: 0, kills: 0, checks: 0 };

  if (!p.maxHp || p.maxHp < 1) p.maxHp = 1;
  if (typeof p.hp !== 'number' || p.hp < 1) p.hp = p.maxHp;
  if (p.hp > p.maxHp) p.hp = p.maxHp;

  /* 场景失效则退回序章，避免读档后卡在白屏 */
  if (!DATA.SCENES[st.scene]) { dropped.push('场景 ' + st.scene); st.scene = 'prologue'; }

  return st;
}

/* —— 成就（跨周目持久，独立于存档） ——
   DATA.ACHIEVEMENTS[id].test(state) 返回 true 即解锁；
   解锁记录保存在独立的 localStorage 键中，删除存档 / 结局清档不影响。 */
const ACHV_KEY = 'starfall_rpg_achv_v1';
const Achieve = {
  _set: null,
  all() {
    if (this._set) return this._set;
    try { this._set = new Set(JSON.parse(localStorage.getItem(ACHV_KEY) || '[]')); }
    catch (e) { this._set = new Set(); }
    return this._set;
  },
  has(id) { return this.all().has(id); },
  count() { return this.all().size; },
  unlock(id) {
    const def = DATA.ACHIEVEMENTS[id];
    if (!def || this.has(id)) return false;
    this.all().add(id);
    try { localStorage.setItem(ACHV_KEY, JSON.stringify(Array.from(this.all()))); } catch (e) {}
    UI.toast('🏆 成就解锁：' + def.name, 'good');
    UI.log('🏆 成就解锁：' + def.icon + ' ' + def.name + ' —— ' + def.desc, 'sys');
    Sfx.play('levelup');
    return true;
  },
  check(state) {
    if (!state || !DATA.ACHIEVEMENTS) return;
    for (const id in DATA.ACHIEVEMENTS) {
      if (this.has(id)) continue;
      try { if (DATA.ACHIEVEMENTS[id].test(state)) this.unlock(id); } catch (e) {}
    }
  },
};

/* —— 新角色 —— */
function newGameState(clsId) {
  const c = DATA.CLASSES[clsId];
  const state = {
    scene: 'prologue',
    player: {
      cls: c.id,
      hp: c.maxHp, maxHp: c.maxHp,
      level: 1, xp: 0,
      gold: 30,
      stats: Object.assign({}, c.stats),
      gear: Object.assign({ charm: null }, c.gear),
    },
    deck: c.deck.slice(),
    items: { potion: 2 },
    relics: [],
    flags: {},
    journal: { quests: [], notes: [] },
    stats: { battles: 0, kills: 0, checks: 0 },
    repaired: [],
  };
  return state;
}

/* —— 任务日志 —— */
const Quest = {
  add(state, id) {
    const def = DATA.QUESTS[id];
    if (!def) return;
    state.journal = state.journal || { quests: [], notes: [] };
    if (state.journal.quests.some((q) => q.id === id)) return;
    state.journal.quests.push({ id, status: 'active' });
    UI.toast('📜 ' + def.kind + '任务：' + def.name, 'good');
    UI.log('📜 任务新增（' + def.kind + '）：' + def.name, 'sys');
    Sfx.play('check');
  },
  done(state, id) {
    if (!state.journal) return;
    const q = state.journal.quests.find((x) => x.id === id);
    if (!q || q.status === 'done') return;
    q.status = 'done';
    const def = DATA.QUESTS[id];
    if (def) {
      UI.toast('✅ 任务完成：' + def.name, 'good');
      UI.log('✅ 任务完成：' + def.name, 'sys');
      Sfx.play('levelup');
    }
  },
};

/* —— 情报笔记 —— */
const Note = {
  add(state, id) {
    const def = DATA.NOTES[id];
    if (!def) return;
    state.journal = state.journal || { quests: [], notes: [] };
    if (state.journal.notes.some((n) => n.id === id)) return;
    state.journal.notes.push({ id });
    UI.toast('📓 笔记：' + def.title);
    UI.log('📓 笔记记录：' + def.title, 'gain');
    Sfx.play('card');
  },
};

/* —— 装备加成 —— */
function gearBonus(state) {
  const g = state.player.gear || {};
  let atk = 0, def = 0;
  for (const slot of ['weapon', 'armor', 'charm']) {
    const id = g[slot];
    if (!id) continue;
    const gd = DATA.GEAR[id];
    if (!gd) continue;
    if (gd.atk) atk += gd.atk;
    if (gd.def) def += gd.def;
  }
  return { atk, def };
}

/* —— 遗物 —— */
function hasRelic(state, id) {
  return Array.isArray(state.relics) && state.relics.indexOf(id) >= 0;
}

/* 遗物数值效果聚合（同字段多件叠加），供战斗引擎各钩子读取 */
function relicSum(state) {
  const out = {};
  if (!Array.isArray(state.relics)) return out;
  for (const id of state.relics) {
    const r = DATA.RELICS[id];
    if (!r) continue;
    for (const k of ['startBlock', 'startStrength', 'enemyVuln', 'startLossHp', 'maxEnergy', 'energyFirst',
                     'drawFirst', 'turnHeal', 'poisonPlus', 'thorns', 'winHeal', 'goldPct', 'xpPct']) {
      if (r[k]) out[k] = (out[k] || 0) + r[k];
    }
  }
  return out;
}

/* —— 含装备加成的属性（用于检定） —— */
function effStat(state, stat) {
  let v = state.player.stats[stat] || 0;
  const g = state.player.gear || {};
  for (const slot of ['charm']) {
    const id = g[slot];
    if (!id) continue;
    const gd = DATA.GEAR[id];
    if (gd && gd.stat === stat) v += gd.v;
  }
  return v;
}

/* 检定加值：属性 ×2，另计遗物的检定加值 */
function checkMod(state, stat) {
  let v = effStat(state, stat) * 2;
  if (Array.isArray(state.relics)) {
    for (const id of state.relics) {
      const r = DATA.RELICS[id];
      if (r && r.check && r.check.stat === stat) v += r.check.v;
    }
  }
  return v;
}

/* —— 效果结算。fx: {gold, hp, healPct, item, useItem, card, gear, flag, flag2:{k:v}, stat:{k:v}, xp} —— */
function applyEffects(state, fx) {
  if (!fx) return;
  const p = state.player;
  if (fx.gold) {
    p.gold = Math.max(0, p.gold + fx.gold);
    UI.log((fx.gold > 0 ? '💰 获得 ' : '💰 支出 ') + Math.abs(fx.gold) + ' 金币', 'gain');
  }
  if (fx.hp) {
    p.hp = Math.max(0, Math.min(p.maxHp, p.hp + fx.hp));
    if (fx.hp < 0) UI.log('💔 生命 ' + fx.hp, 'battle');
  }
  if (fx.healPct) {
    const amt = Math.round(p.maxHp * fx.healPct / 100);
    p.hp = Math.min(p.maxHp, p.hp + amt);
    UI.log('💚 恢复 ' + amt + ' 点生命', 'gain');
  }
  if (fx.item) {
    state.items[fx.item] = (state.items[fx.item] || 0) + 1;
    UI.log('🎁 获得 ' + DATA.ITEMS[fx.item].name, 'gain');
  }
  if (fx.useItem) {
    const n = state.items[fx.useItem] || 0;
    if (n > 0) {
      state.items[fx.useItem] = n - 1;
      if (state.items[fx.useItem] <= 0) delete state.items[fx.useItem];
      UI.log('🔥 消耗 ' + DATA.ITEMS[fx.useItem].name, 'battle');
    }
  }
  if (fx.card) {
    state.deck.push(fx.card);
    UI.log('🂠 获得卡牌【' + DATA.CARDS[fx.card].name + '】', 'gain');
  }
  if (fx.gear) {
    const gd = DATA.GEAR[fx.gear];
    if (gd) {
      p.gear[gd.slot] = gd.id;
      UI.log('⚔️ 装备 ' + gd.name, 'gain');
    }
  }
  if (fx.relic) {
    if (!Array.isArray(state.relics)) state.relics = [];
    if (!hasRelic(state, fx.relic)) {
      state.relics.push(fx.relic);
      const rd = DATA.RELICS[fx.relic];
      if (rd) {
        UI.log('⚱️ 获得遗物【' + rd.name + '】—— ' + rd.desc, 'gain');
        UI.toast('⚱️ 遗物：' + rd.name, 'good');
        Sfx.play('coin');
      }
    }
  }
  if (fx.flag) state.flags[fx.flag] = true;
  if (fx.flag2) for (const k in fx.flag2) state.flags[k] = fx.flag2[k];
  if (fx.note) Note.add(state, fx.note);
  if (fx.quest) Quest.add(state, fx.quest);
  if (fx.questDone) Quest.done(state, fx.questDone);
  if (fx.stat) {
    for (const k in fx.stat) {
      p.stats[k] = (p.stats[k] || 0) + fx.stat[k];
      UI.log('📈 ' + ({ pow: '力量', agi: '敏捷', int: '智力', cha: '魅力' }[k] || k) + ' +' + fx.stat[k], 'gain');
    }
  }
  if (fx.xp) gainXp(state, fx.xp);
}

/* —— 经验与升级 —— */
function xpNeeded(level) { return 25 * level; }

function gainXp(state, n) {
  const p = state.player;
  p.xp += n;
  UI.log('⭐ 经验 +' + n, 'gain');
  while (p.xp >= xpNeeded(p.level)) {
    p.xp -= xpNeeded(p.level);
    p.level += 1;
    p.maxHp += 8;
    p.hp = Math.min(p.maxHp, p.hp + 15);
    UI.toast('🎉 升级！Lv.' + p.level + '（生命上限 +8）', 'good');
    UI.log('🎉 升级！Lv.' + p.level, 'sys');
    Sfx.play('levelup');
  }
}

/* —— 物品使用（非战斗） —— */
function useItemOutside(state, itemId) {
  const it = DATA.ITEMS[itemId];
  if (!it || !it.use || it.combatOnly) return false;
  const p = state.player;
  if (it.use.heal) {
    if (p.hp >= p.maxHp) { UI.toast('生命已满', 'bad'); return false; }
    p.hp = Math.min(p.maxHp, p.hp + it.use.heal);
    UI.toast('💚 恢复 ' + it.use.heal + ' 点生命', 'good');
  }
  state.items[itemId] -= 1;
  if (state.items[itemId] <= 0) delete state.items[itemId];
  Sfx.play('heal');
  UI.renderChar();
  return true;
}
