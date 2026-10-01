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
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { return false; }
    Codex.markState(state); /* 牌组与遗物随存档自动收录进图鉴 */
    return true;
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

  /* 难度 / 周目字段补齐（旧存档无此字段） */
  if (st.diff !== 1) st.diff = 0;
  st.cycle = (typeof st.cycle === 'number' && isFinite(st.cycle) && st.cycle >= 1) ? Math.floor(st.cycle) : 1;

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

/* —— 冒险图鉴（跨周目持久，独立于存档） ——
   收录条件：获得过的卡牌 / 持有过的遗物 / 击败过的敌人。
   牌组与遗物随每次存档自动收录；敌人在战斗胜利时收录。 */
const CODEX_KEY = 'starfall_rpg_codex_v1';
const Codex = {
  _data: null,
  all() {
    if (this._data) return this._data;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CODEX_KEY) || 'null'); } catch (e) {}
    this._data = {
      cards: [], relics: [], enemies: [],
      ...(d && typeof d === 'object' ? d : {}),
    };
    /* 数据版本更新后清理失效 ID（与存档自愈同一思路） */
    this._data.cards = this._data.cards.filter((id) => !!DATA.CARDS[id]);
    this._data.relics = this._data.relics.filter((id) => !!DATA.RELICS[id]);
    this._data.enemies = this._data.enemies.filter((id) => !!DATA.ENEMIES[id]);
    return this._data;
  },
  has(kind, id) { return this.all()[kind].indexOf(id) >= 0; },
  mark(kind, ids) {
    const defs = kind === 'cards' ? DATA.CARDS : kind === 'relics' ? DATA.RELICS : DATA.ENEMIES;
    const arr = this.all()[kind];
    let added = 0;
    for (const id of (Array.isArray(ids) ? ids : [ids])) {
      if (!id || !defs[id] || arr.indexOf(id) >= 0) continue;
      arr.push(id);
      added += 1;
    }
    if (added) {
      try { localStorage.setItem(CODEX_KEY, JSON.stringify(this.all())); } catch (e) {}
    }
    return added;
  },
  markState(st) {
    this.mark('cards', st.deck || []);
    this.mark('relics', st.relics || []);
  },
  count(kind) {
    const d = this.all();
    return kind ? d[kind].length : d.cards.length + d.relics.length + d.enemies.length;
  },
  total() {
    return Object.keys(DATA.CARDS).length + Object.keys(DATA.RELICS).length + Object.keys(DATA.ENEMIES).length;
  },
};

/* —— 周目（跨周目持久，独立于存档） ——
   通关任一结局时:周目数 +1,并快照本局的遗物与金币，
   供下一次「继承开局」使用。 */
const CYCLE_KEY = 'starfall_rpg_cycle_v1';
const Cycle = {
  _data: null,
  all() {
    if (this._data) return this._data;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CYCLE_KEY) || 'null'); } catch (e) {}
    d = (d && typeof d === 'object') ? d : {};
    this._data = {
      count: (typeof d.count === 'number' && isFinite(d.count) && d.count >= 0) ? Math.floor(d.count) : 0,
      relics: Array.isArray(d.relics) ? d.relics.filter((id) => !!DATA.RELICS[id]) : [],
      gold: (typeof d.gold === 'number' && isFinite(d.gold) && d.gold > 0) ? Math.floor(d.gold) : 0,
    };
    return this._data;
  },
  save() { try { localStorage.setItem(CYCLE_KEY, JSON.stringify(this.all())); } catch (e) {} },
  /* 通关结算：周目数 +1，快照本局遗产（过滤失效 ID；金币全额记录，继承时再减半） */
  recordClear(state) {
    const d = this.all();
    d.count += 1;
    d.relics = Array.isArray(state.relics) ? state.relics.filter((id) => !!DATA.RELICS[id]) : [];
    d.gold = (state.player && state.player.gold) || 0;
    this.save();
    return d.count;
  },
  count() { return this.all().count; },
};

/* —— 迷雾回廊（无尽模式，跨周目持久，独立于存档） ——
   记录：最深层数 best、穿过侧门的次数 doors、遭遇过的异变种类 ev。
   死亡、删档、开新局都不会抹掉它们——雾记得每一个走得够深的人。 */
const ENDLESS_KEY = 'starfall_rpg_endless_v1';
const Endless = {
  _data: null,
  _load() {
    if (this._data) return this._data;
    let v = null;
    try { v = JSON.parse(localStorage.getItem(ENDLESS_KEY) || 'null'); } catch (e) {}
    v = (v && typeof v === 'object') ? v : {};
    this._data = {
      best: (typeof v.best === 'number' && isFinite(v.best) && v.best > 0) ? Math.floor(v.best) : 0,
      doors: (typeof v.doors === 'number' && isFinite(v.doors) && v.doors > 0) ? Math.floor(v.doors) : 0,
      ev: Array.isArray(v.ev) ? v.ev.filter((x) => typeof x === 'string') : [],
    };
    return this._data;
  },
  _save() { try { localStorage.setItem(ENDLESS_KEY, JSON.stringify(this._load())); } catch (e) {} },
  best() { return this._load().best; },
  doors() { return this._load().doors; },
  events() { return this._load().ev; },
  /* 抵达新深度则写入纪录，返回是否刷新纪录 */
  reach(depth) {
    const d = this._load();
    if (!(typeof depth === 'number' && isFinite(depth) && depth > d.best)) return false;
    d.best = Math.floor(depth);
    this._save();
    return true;
  },
  /* 穿过一扇雾中侧门 */
  door() { this._load().doors += 1; this._save(); },
  /* 记录遭遇过的异变种类（跨周目，用于成就） */
  markEvent(id) {
    const d = this._load();
    if (d.ev.indexOf(id) >= 0) return;
    d.ev.push(id);
    this._save();
  },
};

/* —— 新角色 ——
   opts: { diff, cycle, relics, gold } —— 迷雾试炼难度 / 周目数 / 继承的遗物与金币 */
function newGameState(clsId, opts) {
  opts = opts || {};
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
    diff: opts.diff === 1 ? 1 : 0,                          /* 0 磨砺(标准) / 1 迷雾试炼(困难) */
    cycle: (opts.cycle > 1) ? Math.floor(opts.cycle) : 1,   /* 周目数 */
  };
  if (Array.isArray(opts.relics)) {
    for (const id of opts.relics) {
      if (DATA.RELICS[id] && state.relics.indexOf(id) < 0) state.relics.push(id);
    }
  }
  if (opts.gold > 0) state.player.gold += Math.floor(opts.gold);
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

/* —— 难度 / 周目 / 回廊层数 敌人成长 ——
   diff 1 = 迷雾试炼（困难）；cycle 为周目数，≥2 时敌人随周目递增；
   迷雾回廊（flags.endless）中敌人随已破开的雾墙层数（endlessDepth）继续递增。
   缩放在每场战斗开始时对敌群整体生效，同一局内数值恒定。 */
function enemyScale(state) {
  const diff = state.diff === 1 ? 1 : 0;
  const cyc = Math.max(0, (state.cycle || 1) - 1);
  const fl = (state.flags && state.flags.endless) ? Math.max(0, state.flags.endlessDepth || 0) : 0;
  return {
    hpMul: (diff ? 1.35 : 1) * (1 + 0.25 * cyc) * (1 + 0.15 * fl),
    dmgAdd: (diff ? 2 : 0) + cyc + Math.floor(fl / 2),
    rewardMul: (1 + 0.15 * cyc) * (diff ? 1.25 : 1) * (1 + 0.08 * fl),
  };
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
  if (fx.hpPct) {
    /* 按生命上限百分比增减（负值为代价），回廊异变用它表达"以血为价" */
    const amt = Math.round(p.maxHp * Math.abs(fx.hpPct) / 100) * (fx.hpPct < 0 ? -1 : 1);
    p.hp = Math.max(0, Math.min(p.maxHp, p.hp + amt));
    if (amt < 0) UI.log('💔 生命 ' + amt, 'battle');
    else UI.log('💚 恢复 ' + amt + ' 点生命', 'gain');
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
