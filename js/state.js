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
      if (!st.journal) st.journal = { quests: [], notes: [] }; /* 旧存档兼容 */
      return st;
    } catch (e) { return null; }
  },
  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
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
    flags: {},
    journal: { quests: [], notes: [] },
    stats: { battles: 0, kills: 0, checks: 0 },
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

/* 检定加值：属性 ×2 */
function checkMod(state, stat) { return effStat(state, stat) * 2; }

/* —— 效果结算。fx: {gold, hp, healPct, item, card, gear, flag, flag2:{k:v}, stat:{k:v}, xp} —— */
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
