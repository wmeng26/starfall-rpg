'use strict';
/* ============================================================
   星坠之谜 — 游戏数据
   卡牌 / 遗物 / 敌人 / 物品 / 装备 / 商店 / 剧情场景
   ============================================================ */
const DATA = {};

/* ============================ 职业 ============================ */
DATA.CLASSES = {
  warrior: {
    id: 'warrior', name: '战士', art: '🛡️',
    desc: '身经百战的佣兵。生命厚实，擅长正面拼杀。',
    maxHp: 85,
    stats: { pow: 3, agi: 1, int: 1, cha: 2 },
    gear: { weapon: 'rusty_sword', armor: 'cloth' },
    deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'war_cry', 'heavy_slash'],
  },
  mage: {
    id: 'mage', name: '法师', art: '🔮',
    desc: '游学四方的元素使者。身躯脆弱，爆发惊人。',
    maxHp: 62,
    stats: { pow: 1, agi: 1, int: 4, cha: 2 },
    gear: { weapon: 'oak_staff', armor: null },
    deck: ['magic_bolt', 'magic_bolt', 'magic_bolt', 'magic_bolt', 'arcane_shield', 'arcane_shield', 'arcane_shield', 'arcane_shield', 'ice_shard', 'meditate'],
  },
  ranger: {
    id: 'ranger', name: '游侠', art: '🏹',
    desc: '林间猎手。灵活多变，箭无虚发。',
    maxHp: 72,
    stats: { pow: 2, agi: 3, int: 2, cha: 2 },
    gear: { weapon: 'short_bow', armor: null },
    deck: ['aim_shot', 'aim_shot', 'aim_shot', 'aim_shot', 'aim_shot', 'defend', 'defend', 'defend', 'double_shot', 'dead_mark'],
  },
};

/* ============================ 卡牌 ============================
   fx 字段: dmg / times / dmgAll / block / heal / draw / energy /
            cleanse / statusEnemy / statusAllEnemy / statusSelf
   special: 'execute' 处决
============================================================ */
DATA.CARDS = {
  /* —— 通用基础 —— */
  strike:        { id: 'strike', name: '打击', cost: 1, type: 'attack', cls: null, rarity: 'starter', target: 'enemy', fx: { dmg: 6 }, desc: '造成 6 点伤害。' },
  defend:        { id: 'defend', name: '防御', cost: 1, type: 'skill', cls: null, rarity: 'starter', target: 'self', fx: { block: 5 }, desc: '获得 5 点护甲。' },
  magic_bolt:    { id: 'magic_bolt', name: '魔弹', cost: 1, type: 'attack', cls: 'mage', rarity: 'starter', target: 'enemy', fx: { dmg: 5 }, desc: '造成 5 点伤害。' },
  arcane_shield: { id: 'arcane_shield', name: '奥术护盾', cost: 1, type: 'skill', cls: 'mage', rarity: 'starter', target: 'self', fx: { block: 4, draw: 1 }, desc: '获得 4 点护甲，抽 1 张牌。' },
  aim_shot:      { id: 'aim_shot', name: '精准射击', cost: 1, type: 'attack', cls: 'ranger', rarity: 'starter', target: 'enemy', fx: { dmg: 6 }, desc: '造成 6 点伤害。' },

  /* —— 战士 —— */
  war_cry:     { id: 'war_cry', name: '战吼', cost: 1, type: 'skill', cls: 'warrior', rarity: 'common', target: 'all', fx: { statusAllEnemy: { vuln: 1 } }, desc: '所有敌人获得 1 层易伤。' },
  heavy_slash: { id: 'heavy_slash', name: '重斩', cost: 2, type: 'attack', cls: 'warrior', rarity: 'starter', target: 'enemy', fx: { dmg: 13 }, desc: '造成 13 点伤害。' },
  cleave:      { id: 'cleave', name: '顺劈斩', cost: 2, type: 'attack', cls: 'warrior', rarity: 'common', target: 'all', fx: { dmgAll: 9 }, desc: '对所有敌人造成 9 点伤害。' },
  iron_wall:   { id: 'iron_wall', name: '铁壁', cost: 2, type: 'skill', cls: 'warrior', rarity: 'common', target: 'self', fx: { block: 12 }, desc: '获得 12 点护甲。' },
  pierce:      { id: 'pierce', name: '破甲', cost: 1, type: 'attack', cls: 'warrior', rarity: 'common', target: 'enemy', fx: { dmg: 4, statusEnemy: { vuln: 2 } }, desc: '造成 4 点伤害，给予 2 层易伤。' },
  battle_rage: { id: 'battle_rage', name: '蓄力', cost: 1, type: 'power', cls: 'warrior', rarity: 'rare', target: 'self', fx: { statusSelf: { strength: 2 } }, desc: '获得 2 层力量。（力量：每次攻击 +N 伤害）' },
  execute:     { id: 'execute', name: '处决', cost: 2, type: 'attack', cls: 'warrior', rarity: 'rare', target: 'enemy', fx: { special: 'execute' }, desc: '目标生命低于 40% 时造成 22 点伤害，否则 9 点。' },
  whirlwind:   { id: 'whirlwind', name: '旋风斩', cost: 1, type: 'attack', cls: 'warrior', rarity: 'common', target: 'all', fx: { dmgAll: 5 }, desc: '对所有敌人造成 5 点伤害。' },
  starfall_slash: { id: 'starfall_slash', name: '星陨斩', cost: 2, type: 'attack', cls: 'warrior', rarity: 'rare', target: 'enemy', fx: { dmg: 9, statusSelf: { strength: 1 } }, desc: '造成 9 点伤害，获得 1 层力量。' },
  blood_rage:  { id: 'blood_rage', name: '燃血', cost: 0, type: 'skill', cls: 'warrior', rarity: 'rare', target: 'self', fx: { hp: -4, statusSelf: { strength: 2 } }, desc: '燃烧生命换取力量：失去 4 点生命，获得 2 层力量。' },

  /* —— 法师 —— */
  ice_shard:       { id: 'ice_shard', name: '冰锥', cost: 1, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 5, statusEnemy: { weak: 1 } }, desc: '造成 5 点伤害，给予 1 层虚弱。' },
  fireball:        { id: 'fireball', name: '火球术', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 15 }, desc: '造成 15 点伤害。' },
  chain_lightning: { id: 'chain_lightning', name: '闪电链', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'all', fx: { dmgAll: 8 }, desc: '对所有敌人造成 8 点伤害。' },
  drain_life:      { id: 'drain_life', name: '吸取生命', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 8, heal: 5 }, desc: '造成 8 点伤害，恢复 5 点生命。' },
  meditate:        { id: 'meditate', name: '冥想', cost: 1, type: 'skill', cls: 'mage', rarity: 'common', target: 'self', fx: { draw: 2 }, desc: '抽 2 张牌。' },
  flamestorm:      { id: 'flamestorm', name: '烈焰风暴', cost: 3, type: 'attack', cls: 'mage', rarity: 'rare', target: 'all', fx: { dmgAll: 14 }, desc: '对所有敌人造成 14 点伤害。' },
  mana_surge:      { id: 'mana_surge', name: '法力涌动', cost: 0, type: 'power', cls: 'mage', rarity: 'rare', target: 'self', fx: { energy: 2 }, desc: '本回合获得 2 点行动力。' },
  curse_bind:      { id: 'curse_bind', name: '咒缚', cost: 1, type: 'attack', cls: 'mage', rarity: 'rare', target: 'enemy', fx: { dmg: 3, statusEnemy: { weak: 2 } }, desc: '造成 3 点伤害，给予 2 层虚弱。' },
  supernova:       { id: 'supernova', name: '超新星', cost: 3, type: 'attack', cls: 'mage', rarity: 'rare', target: 'all', fx: { dmgAll: 10, statusAllEnemy: { vuln: 1 } }, desc: '对所有敌人造成 10 点伤害，给予 1 层易伤。' },
  frost_armor:     { id: 'frost_armor', name: '霜甲术', cost: 1, type: 'skill', cls: 'mage', rarity: 'rare', target: 'self', fx: { block: 7, statusAllEnemy: { weak: 1 } }, desc: '获得 7 点护甲，所有敌人获得 1 层虚弱。' },

  /* —— 游侠 —— */
  double_shot:     { id: 'double_shot', name: '双重射击', cost: 1, type: 'attack', cls: 'ranger', rarity: 'starter', target: 'enemy', fx: { dmg: 4, times: 2 }, desc: '造成 4 点伤害，共 2 次。' },
  poison_arrow:    { id: 'poison_arrow', name: '淬毒箭', cost: 1, type: 'attack', cls: 'ranger', rarity: 'common', target: 'enemy', fx: { dmg: 3, statusEnemy: { poison: 3 } }, desc: '造成 3 点伤害，给予 3 层中毒。' },
  volley:          { id: 'volley', name: '箭雨', cost: 2, type: 'attack', cls: 'ranger', rarity: 'common', target: 'all', fx: { dmgAll: 6, draw: 1 }, desc: '对所有敌人造成 6 点伤害，抽 1 张牌。' },
  dead_mark:       { id: 'dead_mark', name: '致命标记', cost: 0, type: 'skill', cls: 'ranger', rarity: 'starter', target: 'enemy', fx: { statusEnemy: { vuln: 2 } }, desc: '给予目标 2 层易伤。' },
  swift_retreat:   { id: 'swift_retreat', name: '灵巧后跃', cost: 1, type: 'skill', cls: 'ranger', rarity: 'common', target: 'self', fx: { block: 4, statusAllEnemy: { weak: 1 } }, desc: '获得 4 点护甲，所有敌人获得 1 层虚弱。' },
  piercing_arrow:  { id: 'piercing_arrow', name: '贯穿箭', cost: 2, type: 'attack', cls: 'ranger', rarity: 'rare', target: 'enemy', fx: { dmg: 12 }, desc: '造成 12 点伤害。' },
  hunters_instinct:{ id: 'hunters_instinct', name: '猎人直觉', cost: 1, type: 'power', cls: 'ranger', rarity: 'rare', target: 'self', fx: { statusSelf: { strength: 1 }, draw: 1 }, desc: '获得 1 层力量，抽 1 张牌。' },
  triple_shot:     { id: 'triple_shot', name: '连珠三矢', cost: 2, type: 'attack', cls: 'ranger', rarity: 'rare', target: 'enemy', fx: { dmg: 4, times: 3 }, desc: '造成 4 点伤害，共 3 次。' },
  poison_rain:     { id: 'poison_rain', name: '淬毒箭雨', cost: 2, type: 'attack', cls: 'ranger', rarity: 'rare', target: 'all', fx: { dmgAll: 4, statusAllEnemy: { poison: 2 } }, desc: '对所有敌人造成 4 点伤害，给予 2 层中毒。' },

  /* —— 中立 —— */
  first_aid:      { id: 'first_aid', name: '急救', cost: 1, type: 'skill', cls: null, rarity: 'common', target: 'self', fx: { heal: 9 }, desc: '恢复 9 点生命。' },
  energy_crystal: { id: 'energy_crystal', name: '能量水晶', cost: 0, type: 'skill', cls: null, rarity: 'rare', target: 'self', fx: { energy: 2 }, desc: '本回合获得 2 点行动力。' },
  shadow_strike:  { id: 'shadow_strike', name: '影袭', cost: 1, type: 'attack', cls: null, rarity: 'common', target: 'enemy', fx: { dmg: 8 }, desc: '造成 8 点伤害。' },
  star_dust:      { id: 'star_dust', name: '星屑飞尘', cost: 1, type: 'attack', cls: null, rarity: 'common', target: 'all', fx: { dmgAll: 5, statusAllEnemy: { poison: 1 } }, desc: '对所有敌人造成 5 点伤害，给予 1 层中毒。' },
  star_blessing:  { id: 'star_blessing', name: '星辰庇佑', cost: 1, type: 'skill', cls: null, rarity: 'rare', target: 'self', fx: { block: 6, heal: 4 }, desc: '获得 6 点护甲，恢复 4 点生命。' },
  meteor:         { id: 'meteor', name: '陨星术', cost: 2, type: 'attack', cls: null, rarity: 'rare', target: 'all', fx: { dmgAll: 11 }, desc: '召引天火，对所有敌人造成 11 点伤害。' },
  echo_strike:    { id: 'echo_strike', name: '六人斩', cost: 2, type: 'attack', cls: null, rarity: 'rare', target: 'enemy', fx: { dmg: 4, times: 4 }, desc: '六道残影与你并肩挥击，造成 4 点伤害，共 4 次。' },
  chime:          { id: 'chime', name: '清铃音', cost: 1, type: 'skill', cls: null, rarity: 'common', target: 'self', fx: { cleanse: true, draw: 1 }, desc: '清脆的铃音驱散自身负面状态，抽 1 张牌。' },
  purify:         { id: 'purify', name: '净化之光', cost: 1, type: 'skill', cls: null, rarity: 'rare', target: 'self', fx: { cleanse: true, heal: 5 }, desc: '清除自身所有负面状态，恢复 5 点生命。' },
  shadow_rage:    { id: 'shadow_rage', name: '影之怒', cost: 3, type: 'attack', cls: null, rarity: 'boss', target: 'all', fx: { dmgAll: 12, statusAllEnemy: { weak: 1 } }, desc: '对所有敌人造成 12 点伤害，给予 1 层虚弱。' },
  mist_pact:      { id: 'mist_pact', name: '雾之契约', cost: 1, type: 'power', cls: null, rarity: 'boss', target: 'self', fx: { statusSelf: { strength: 2, weak: 1 } }, desc: '获得 2 层力量与 1 层虚弱。低语在你脑中盘旋不去。' },
};

/* ============================ 装备 ============================ */
DATA.GEAR = {
  rusty_sword: { id: 'rusty_sword', name: '锈蚀短剑', slot: 'weapon', atk: 1, desc: '攻击伤害 +1' },
  oak_staff:   { id: 'oak_staff', name: '橡木法杖', slot: 'weapon', atk: 1, desc: '攻击伤害 +1' },
  short_bow:   { id: 'short_bow', name: '短猎弓', slot: 'weapon', atk: 1, desc: '攻击伤害 +1' },
  iron_sword:  { id: 'iron_sword', name: '精铁长剑', slot: 'weapon', atk: 2, desc: '攻击伤害 +2' },
  cloth:        { id: 'cloth', name: '粗布衣', slot: 'armor', def: 1, desc: '护甲值 +1' },
  leather_armor:{ id: 'leather_armor', name: '硬皮甲', slot: 'armor', def: 2, desc: '护甲值 +2' },
  chain_mail:   { id: 'chain_mail', name: '锁子甲', slot: 'armor', def: 3, desc: '护甲值 +3' },
  amulet_pow:  { id: 'amulet_pow', name: '力量护符', slot: 'charm', stat: 'pow', v: 1, desc: '力量 +1' },
  amulet_agi:  { id: 'amulet_agi', name: '迅捷护腕', slot: 'charm', stat: 'agi', v: 1, desc: '敏捷 +1' },
  wolf_fang:   { id: 'wolf_fang', name: '狼王獠牙', slot: 'charm', stat: 'pow', v: 1, desc: '力量 +1' },
  miner_lamp:  { id: 'miner_lamp', name: '矿工的头灯', slot: 'charm', stat: 'int', v: 1, desc: '智力 +1' },
  star_speaker: { id: 'star_speaker', name: '星语者徽记', slot: 'charm', stat: 'cha', v: 1, desc: '魅力 +1' },
  star_blade:   { id: 'star_blade', name: '星辉长剑', slot: 'weapon', atk: 3, desc: '攻击伤害 +3' },
  night_chime:  { id: 'night_chime', name: '守夜风铃', slot: 'charm', def: 1, desc: '护甲值 +1（铃音结界）' },
};

/* ============================ 物品 ============================ */
DATA.ITEMS = {
  potion:        { id: 'potion', name: '治疗药水', art: '🧪', desc: '恢复 25 点生命。', use: { heal: 25 }, price: 30 },
  big_potion:    { id: 'big_potion', name: '大治疗药水', art: '🍶', desc: '恢复 60 点生命。', use: { heal: 60 }, price: 65 },
  star_dew:      { id: 'star_dew', name: '星辉露珠', art: '🌟', desc: '恢复 40 点生命。带着一点点星屑的甜。', use: { heal: 40 } },
  firebomb:      { id: 'firebomb', name: '火焰瓶', art: '🔥', desc: '对一名敌人造成 16 点伤害。（战斗）', use: { dmg: 16 }, combatOnly: true, price: 35 },
  energy_potion: { id: 'energy_potion', name: '能量药水', art: '⚡', desc: '获得 2 点行动力。（战斗）', use: { energy: 2 }, combatOnly: true, price: 50 },
  antidote:      { id: 'antidote', name: '解毒草', art: '🌿', desc: '清除自身负面状态。（战斗）', use: { cleanse: true }, combatOnly: true, price: 25 },
  star_shard:    { id: 'star_shard', name: '星核碎片', art: '💠', desc: '任务物品。温热，像一颗小小的心脏。', quest: true },
  miner_note:    { id: 'miner_note', name: '矿工的遗嘱', art: '📜', desc: '记着矿坑深处的传闻。', quest: true },
};

/* ============================ 遗物 ============================
   星尘遗物：被动生效的稀有物件，无需装备，整局持续有效。
   效果字段（引擎在各钩子处读取，可多件叠加）:
     startBlock / startStrength / enemyVuln / startLossHp  战斗开始
     maxEnergy / energyFirst / drawFirst / turnHeal         回合资源
     poisonPlus（你的中毒 +N 层）/ thorns（受击反弹 N 点）
     winHeal / goldPct / xpPct                              战斗胜利
     check: { stat, v }                                     属性检定加值
============================================================ */
DATA.RELICS = {
  silver_tongue:  { id: 'silver_tongue', name: '银铃舌', icon: '🔔', startBlock: 3, desc: '战斗开始时获得 3 点护甲。聋伯的手艺——铃响之处，雾不敢近。' },
  star_pouch:     { id: 'star_pouch', name: '星屑香囊', icon: '✨', enemyVuln: 1, desc: '战斗开始时，所有敌人获得 1 层易伤。囊中的星屑仍在发烫。' },
  wolf_whistle:   { id: 'wolf_whistle', name: '狼骨哨', icon: '🦴', startStrength: 1, desc: '战斗开始时获得 1 层力量。吹响它，就能听见黑松林的冬天。' },
  herb_pouch:     { id: 'herb_pouch', name: '药婆的草香囊', icon: '🌿', turnHeal: 1, desc: '每个回合开始时恢复 1 点生命。捣药声不紧不慢，像许多年前一样。' },
  thorn_ring:     { id: 'thorn_ring', name: '荆棘指环', icon: '💍', thorns: 3, desc: '受到攻击伤害时，反弹 3 点伤害给攻击者。荆棘不辨敌我，只认疼痛。' },
  watch:          { id: 'watch', name: '矿监的怀表', icon: '⏱️', drawFirst: 1, desc: '每场战斗的首回合多抽 1 张牌。表针停在矿难那一刻，却走得出下一秒。' },
  coin_star:      { id: 'coin_star', name: '坠星铜币', icon: '🪙', goldPct: 25, desc: '战斗获得的金币 +25%。币面上那道划痕，是它从天上落下来的痕迹。' },
  keeper_monocle: { id: 'keeper_monocle', name: '守塔人的单片镜', icon: '👓', check: { stat: 'int', v: 3 }, desc: '智力检定 +3。镜片后的那只眼睛，读了一百年的星轨。' },
  bone_flute:     { id: 'bone_flute', name: '低语的骨笛', icon: '🪈', poisonPlus: 1, desc: '你施加的中毒额外 +1 层。笛声很轻，像很多人在同时呼吸。' },
  wine_flask:     { id: 'wine_flask', name: '六人队的酒壶', icon: '🏺', winHeal: 8, desc: '战斗胜利后恢复 8 点生命。壶底还剩最后一口，他们一直留着，等一个赢了的人。' },
  map_shard:      { id: 'map_shard', name: '星图残页', icon: '🗺️', xpPct: 25, desc: '战斗获得的经验 +25%。朱砂圈住的地方，比任何课堂都教得多。' },
  hourglass:      { id: 'hourglass', name: '星辉沙漏', icon: '⏳', energyFirst: 1, desc: '每场战斗的首回合 +1 行动力。沙漏里的光永远流不完——塔的时间没有停过。' },
  worm_eye:       { id: 'worm_eye', name: '王虫的独眼', icon: '🟣', maxEnergy: 1, startLossHp: 3, desc: '行动力上限 +1；每场战斗开始时失去 3 点生命。它仍在山腹深处注视着你。' },
};

/* ============================ 敌人 ============================
   moves: name / dmg / times / block / self(自身状态) / toPlayer(给予玩家状态) / w(权重)
============================================================ */
DATA.ENEMIES = {
  goblin:      { id: 'goblin', name: '哥布林斥候', art: '👺', hp: 20, xp: 14, gold: [4, 8], moves: [
    { name: '挥砍', dmg: 6, w: 3 },
    { name: '偷袭', dmg: 3, times: 2, w: 1 },
    { name: '戒备', block: 5, w: 1 },
  ]},
  goblin_thug: { id: 'goblin_thug', name: '哥布林强盗', art: '👺', hp: 26, xp: 18, gold: [6, 12], moves: [
    { name: '重击', dmg: 9, w: 2 },
    { name: '乱舞', dmg: 4, times: 2, w: 2 },
    { name: '嚎叫', self: { strength: 1 }, w: 1 },
  ]},
  shaman:      { id: 'shaman', name: '哥布林萨满', art: '🧿', hp: 18, xp: 15, gold: [8, 14], moves: [
    { name: '暗影箭', dmg: 6, w: 3 },
    { name: '弱化咒', toPlayer: { weak: 1 }, w: 2 },
    { name: '护盾', block: 6, w: 1 },
  ]},
  wolf:        { id: 'wolf', name: '巨狼', art: '🐺', hp: 24, xp: 16, gold: [5, 10], moves: [
    { name: '撕咬', dmg: 8, w: 3 },
    { name: '扑击', dmg: 4, times: 2, w: 2 },
  ]},
  skeleton:    { id: 'skeleton', name: '骷髅兵', art: '💀', hp: 22, xp: 18, gold: [6, 12], moves: [
    { name: '骨刀', dmg: 7, w: 3 },
    { name: '骨架重组', block: 7, w: 2 },
    { name: '死气', toPlayer: { vuln: 1 }, w: 1 },
  ]},
  spider:      { id: 'spider', name: '毒蛛', art: '🕷️', hp: 15, xp: 12, gold: [4, 8], moves: [
    { name: '毒牙', dmg: 3, toPlayer: { poison: 2 }, w: 3 },
    { name: '噬咬', dmg: 5, w: 2 },
  ]},
  bat:         { id: 'bat', name: '蝙蝠群', art: '🦇', hp: 12, xp: 8, gold: [3, 6], moves: [
    { name: '俯冲', dmg: 4, times: 2, w: 3 },
    { name: '盘旋', block: 4, w: 1 },
  ]},
  statue:      { id: 'statue', name: '石像守卫', art: '🗿', hp: 36, xp: 30, gold: [15, 25], moves: [
    { name: '石拳', dmg: 11, w: 3 },
    { name: '磐石', block: 9, w: 2 },
    { name: '威压', toPlayer: { weak: 1 }, w: 1 },
  ]},
  lurker:      { id: 'lurker', name: '暗影潜伏者', art: '🌑', hp: 26, xp: 24, gold: [10, 18], moves: [
    { name: '影爪', dmg: 9, w: 3 },
    { name: '黑暗侵蚀', dmg: 4, toPlayer: { vuln: 1 }, w: 2 },
    { name: '潜行', block: 6, self: { strength: 1 }, w: 1 },
  ]},
  shadow_mage: { id: 'shadow_mage', name: '堕影术士', art: '👻', hp: 30, xp: 25, gold: [12, 20], moves: [
    { name: '暗影箭', dmg: 7, w: 3 },
    { name: '削弱', dmg: 3, toPlayer: { weak: 1 }, w: 2 },
    { name: '暗影屏障', block: 8, w: 1 },
  ]},
  /* —— 星陨林 —— */
  mist_wisp:  { id: 'mist_wisp', name: '雾灵', art: '🌫️', hp: 16, xp: 12, gold: [4, 8], moves: [
    { name: '触鞭', dmg: 5, w: 3 },
    { name: '低语', toPlayer: { weak: 1 }, w: 2 },
    { name: '雾障', block: 5, w: 1 },
  ]},
  star_moth:  { id: 'star_moth', name: '星蛾', art: '🦋', hp: 13, xp: 10, gold: [3, 6], moves: [
    { name: '扑翼', dmg: 4, times: 2, w: 3 },
    { name: '迷鳞粉', toPlayer: { weak: 1 }, w: 2 },
  ]},
  mist_stag:  { id: 'mist_stag', name: '雾角鹿', art: '🦌', hp: 44, xp: 35, gold: [25, 35], moves: [
    { name: '巨角突刺', dmg: 9, w: 3 },
    { name: '踏地成甲', block: 7, w: 2 },
    { name: '惊蹄', dmg: 3, times: 2, w: 1 },
  ]},
  wisp_echo:  { id: 'wisp_echo', name: '林心低语者', art: '👁️', hp: 72, xp: 60, gold: [45, 60], boss: true, moves: [
    { name: '湮灭触手', dmg: 10, w: 3 },
    { name: '心灵碎片', dmg: 4, times: 2, toPlayer: { vuln: 1 }, w: 2 },
    { name: '腐化之息', toPlayer: { poison: 2 }, w: 2 },
    { name: '雾隐', block: 10, self: { strength: 1 }, w: 1 },
  ]},
  /* —— 古塔 —— */
  shard_wraith: { id: 'shard_wraith', name: '星屑怨影', art: '✨', hp: 24, xp: 22, gold: [10, 16], moves: [
    { name: '光刃', dmg: 7, w: 3 },
    { name: '尘暴', dmg: 3, times: 2, w: 2 },
    { name: '摄魂', toPlayer: { vuln: 1 }, w: 1 },
  ]},
  star_golem:   { id: 'star_golem', name: '星轨石像', art: '☄️', hp: 50, xp: 45, gold: [30, 45], boss: true, moves: [
    { name: '星锤', dmg: 11, w: 3 },
    { name: '星轨护盾', block: 9, w: 2 },
    { name: '引力牵引', toPlayer: { weak: 1 }, w: 2 },
    { name: '碎星击', dmg: 5, times: 2, w: 1 },
  ]},
  /* —— 第七巷 —— */
  wall_thing: { id: 'wall_thing', name: '墙中之物', art: '🫀', hp: 68, xp: 65, gold: [50, 70], boss: true, moves: [
    { name: '吞噬之口', dmg: 10, w: 3 },
    { name: '须蔓乱舞', dmg: 4, times: 2, w: 2 },
    { name: '摄心低语', toPlayer: { weak: 1 }, w: 2 },
    { name: '墙体共鸣', block: 8, self: { strength: 1 }, w: 1 },
  ]},
  /* —— 头目 —— */
  worm:   { id: 'worm', name: '矿坑之王·掘地虫', art: '🪱', hp: 95, xp: 80, gold: [60, 80], boss: true, moves: [
    { name: '吞噬', dmg: 12, w: 3 },
    { name: '地震', dmg: 6, times: 2, w: 2 },
    { name: '硬化甲壳', block: 12, self: { strength: 1 }, w: 2 },
    { name: '酸液', toPlayer: { poison: 3 }, w: 1 },
  ]},
  morgan: { id: 'morgan', name: '堕落守塔人·莫尔甘', art: '😈', hp: 135, xp: 120, gold: [100, 120], boss: true, moves: [
    { name: '星核湮灭', dmg: 13, w: 3 },
    { name: '影之锁链', dmg: 5, times: 2, toPlayer: { vuln: 1 }, w: 2 },
    { name: '暗星护罩', block: 14, w: 2 },
    { name: '汲取星光', dmg: 8, heal: 10, w: 2 },
    { name: '星辰风暴', dmg: 7, times: 3, w: 1 },
  ]},
  /* —— 迷雾回廊（无尽模式）—— 被击碎者不肯散去的回响 */
  worm_echo: { id: 'worm_echo', name: '掘地虫的回响', art: '🪱', hp: 115, xp: 95, gold: [75, 95], boss: true, moves: [
    { name: '回响吞噬', dmg: 13, w: 3 },
    { name: '余震', dmg: 6, times: 2, w: 2 },
    { name: '硬化回声', block: 13, self: { strength: 1 }, w: 2 },
    { name: '酸雾残响', toPlayer: { poison: 3 }, w: 1 },
  ]},
  morgan_echo: { id: 'morgan_echo', name: '守塔人的回响', art: '😈', hp: 160, xp: 135, gold: [115, 145], boss: true, moves: [
    { name: '湮灭回响', dmg: 14, w: 3 },
    { name: '锁链残影', dmg: 5, times: 2, toPlayer: { vuln: 1 }, w: 2 },
    { name: '暗星回罩', block: 15, w: 2 },
    { name: '星光余温', dmg: 8, heal: 10, w: 2 },
    { name: '风暴回声', dmg: 7, times: 3, w: 1 },
  ]},
};

/* ============================ 敌群 ============================ */
DATA.GROUPS = {
  goblin_scout:   ['goblin'],
  goblins2:       ['goblin', 'goblin_thug'],
  wolf_goblin:    ['wolf', 'goblin'],
  shaman_wolf:    ['shaman', 'wolf'],
  wolf_pack:      ['wolf', 'wolf'],
  bandits:        ['goblin_thug', 'goblin_thug', 'shaman'],
  bats:           ['bat', 'bat', 'bat'],
  spiders:        ['spider', 'spider'],
  skeletons:      ['skeleton', 'skeleton'],
  skeleton_spider:['skeleton', 'spider'],
  statue:         ['statue'],
  lurker:         ['lurker', 'bat'],
  grove_wisps:    ['mist_wisp', 'mist_wisp'],
  moth_swarm:     ['star_moth', 'star_moth', 'star_moth'],
  mist_stag:      ['mist_stag'],
  wisp_echo:      ['wisp_echo'],
  tower_wraiths:  ['shard_wraith', 'shard_wraith'],
  tower_guard:    ['star_golem'],
  wall_spawns:    ['lurker', 'spider'],
  wall_thing:     ['wall_thing'],
  boss_worm:      ['worm'],
  boss_morgan:    ['morgan', 'shadow_mage'],
  endless_boss_worm:   ['worm_echo'],
  endless_boss_morgan: ['morgan_echo'],
};

/* 随机遭遇池 */
DATA.ENCOUNTERS = {
  wild: ['goblins2', 'wolf_goblin', 'shaman_wolf', 'bats', 'moth_swarm'],
  mine: ['skeletons', 'spiders', 'bats', 'skeleton_spider', 'statue', 'lurker'],
};

/* ============================ 迷雾回廊（无尽模式） ============================
   通关任一结局后解锁。层数越深，雾墙后的回响越强：
   普通层按 ENDLESS_TIERS 分档随机遭遇；每五层是一场「回响头目」战，
   胜后可从三件未持有的星尘遗物中挑选一件作回礼。
   缩放叠加在难度 / 周目之上（见 state.js 的 enemyScale）。 */
DATA.ENDLESS_TIERS = [
  { min: 1,  max: 2,   groups: ['goblins2', 'wolf_goblin', 'shaman_wolf', 'bats', 'spiders', 'moth_swarm'] },
  { min: 3,  max: 4,   groups: ['skeletons', 'spiders', 'skeleton_spider', 'bandits', 'grove_wisps', 'lurker'] },
  { min: 5,  max: 7,   groups: ['statue', 'lurker', 'tower_wraiths', 'mist_stag', 'skeleton_spider'] },
  { min: 8,  max: 999, groups: ['statue', 'tower_wraiths', 'wall_spawns', 'grove_wisps', 'skeleton_spider', 'lurker'] },
];
/* 回响头目轮换：第 5 / 10 / 15 / 20 层，之后循环（缩放继续加深） */
DATA.ENDLESS_BOSSES = ['endless_boss_worm', 'endless_boss_morgan', 'tower_guard', 'wall_thing'];

function endlessGroupKey(depth) {
  if (depth % 5 === 0) {
    return DATA.ENDLESS_BOSSES[(Math.max(1, Math.floor(depth / 5)) - 1) % DATA.ENDLESS_BOSSES.length];
  }
  for (const t of DATA.ENDLESS_TIERS) {
    if (depth >= t.min && depth <= t.max) return t.groups[Math.floor(Math.random() * t.groups.length)];
  }
  return 'goblins2';
}

/* ============================ 回廊异变（质数层侧门事件） ============================
   质数层（且非五层头目节点）的雾墙根部会裂开一道「侧门」：
   推开它可绕过该层战斗，直面一种回廊异变——福祸难料，但每条出路都有代价或收获。
   异变是"承诺制"的：进了门就没有空手而归的选项，每个选择要么结算收益/代价破层下行
   （special 'endless_pass'，层数照常 +1），要么直接接入一场战斗（win 'endless_clear'）。
   见过的异变种类经 Endless.markEvent 跨周目记录，供成就判定。 */
DATA.ENDLESS_EVENTS = ['ev_stele', 'ev_campfire', 'ev_merchant', 'ev_thief', 'ev_crack', 'ev_ambush'];

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

/* 下一重雾墙（endlessDepth + 1）是否开着侧门：质数层，且不与五层头目重合 */
function endlessDoorFloor(s) {
  const n = ((s.flags && s.flags.endlessDepth) || 0) + 1;
  return (isPrime(n) && n % 5 !== 0) ? n : 0;
}

function endlessEventDepth(s) { return (s.flags && s.flags.endlessDepth) || 0; }

function endlessRandomRelicId(s) {
  const unowned = Object.keys(DATA.RELICS).filter((id) => !hasRelic(s, id));
  return unowned.length ? unowned[Math.floor(Math.random() * unowned.length)] : null;
}

function endlessRandomCardId() {
  const pool = Object.keys(DATA.CARDS).filter((id) => {
    const r = DATA.CARDS[id].rarity;
    return r === 'common' || r === 'rare';
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

/* 行商货担：卡牌 / 物品 / 装备各随机一件，价格随深度上涨；每个货担只属于一层 */
function endlessMerchantStock(depth) {
  const items = ['potion', 'big_potion', 'firebomb', 'energy_potion', 'antidote'];
  const gear = Object.keys(DATA.GEAR);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const itemId = pick(items);
  return [
    { kind: 'card', id: endlessRandomCardId(), price: 25 + 5 * depth },
    { kind: 'item', id: itemId, price: Math.round((DATA.ITEMS[itemId].price || 30) * (1 + 0.08 * depth)) },
    { kind: 'gear', id: pick(gear), price: 40 + 8 * depth },
  ];
}

/* 行商的三个购入选项（按货担下标闭包生成），购入后可继续浏览，道别时才破层 */
function endlessMerchantChoices() {
  const SLOT_NAMES = { weapon: '武器', armor: '护甲', charm: '饰品' };
  return [0, 1, 2].map((i) => ({
    text: (s) => {
      const o = (s.flags.endlessStock || [])[i];
      if (!o) return '';
      if (o.kind === 'card') return '🂠 购入【' + DATA.CARDS[o.id].name + '】';
      if (o.kind === 'gear') return '⚔️ 购入【' + DATA.GEAR[o.id].name + '】';
      const it = DATA.ITEMS[o.id];
      return (it.art || '🎁') + ' 购入【' + it.name + '】';
    },
    subFn: (s) => {
      const o = (s.flags.endlessStock || [])[i];
      if (!o) return null;
      let d = '花费 ' + o.price + ' 金币 · ';
      if (o.kind === 'card') d += DATA.CARDS[o.id].desc;
      else if (o.kind === 'gear') d += SLOT_NAMES[DATA.GEAR[o.id].slot] + ' · ' + DATA.GEAR[o.id].desc;
      else d += DATA.ITEMS[o.id].desc;
      return d;
    },
    show: (s) => !!(s.flags.endlessStock || [])[i],
    requireGold: (s) => { const o = (s.flags.endlessStock || [])[i]; return o ? o.price : 0; },
    fxFn: (s) => {
      const o = (s.flags.endlessStock || [])[i];
      if (!o) return {};
      s.flags.endlessStock[i] = null; /* 售出即下架；go 自身重渲染货架 */
      const fx = { gold: -o.price };
      fx[o.kind] = o.id;
      return fx;
    },
    go: 'ev_merchant',
  }));
}

/* ============================ 剧情场景 ============================
   scene: {
     text: string | (state)=>string,
     onEnter: (state)=>string|场景id   // 返回字符串则追加显示，返回场景id则立即跳转
     choices: [ choice ]  choice: {
       text, icon?, sub?, subFn?, disabled: (state)=>bool,
       show: (state)=>bool, once: 'flagKey',
       check: {stat, dc}, success: {text, go?, combat?, win?, fx?}, fail: {...},
       go, combat, win, fx: {gold,hp,item,card,flag,stat,xp,...}, special, cls
     }
   }
============================================================ */
DATA.SCENES = {

  /* ============ 序章 ============ */
  intro: {
    text: '星坠之夜，天穹裂开一道猩红的缝。\n一道流光越过雾隐镇的尖顶，坠入镇北的迷雾矿坑。自那夜起，矿坑深处传来低语，走兽变得狂暴，雾再也无散去的迹象。\n\n你是被战团派来调查的冒险者。行囊里只有一枚旧铜币，和一柄趁手的家伙。\n\n——你的过去塑造了你。你是谁？',
    choices: [
      { text: '⚔️ 战士', sub: '生命厚实，正面拼杀。初始: 铁壁重斩之术', special: 'class', cls: 'warrior' },
      { text: '🔮 法师', sub: '脆弱但爆发惊人。初始: 元素法术奥义', special: 'class', cls: 'mage' },
      { text: '🏹 游侠', sub: '灵活多变，箭无虚发。初始: 猎手射击弓术', special: 'class', cls: 'ranger' },
    ],
  },

  /* —— 难度选择：职业确定后、序章之前 —— */
  difficulty: {
    text: (s) => {
      let t = '你整了整行囊，检查了武器与干粮。\n\n界碑之外，浓雾在夜色里翻涌如潮。这一程，你要走多险的路？';
      if (s.cycle > 1) {
        t += '\n\n✦ 【第 ' + s.cycle + ' 周目】上一世的遗产已收入行囊：星尘遗物 ×' + (s.relics ? s.relics.length : 0) + '、金币 ' + s.player.gold + '。\n敌人的血与爪将随周目增长——雾，也记得你。';
      }
      return t;
    },
    choices: [
      { text: '⚖️ 磨砺 · 标准旅程', sub: '经典体验：敌人的爪牙如传闻所示', special: 'set_diff', diff: 0 },
      { text: '🌫️ 迷雾试炼 · 困难', sub: '敌人生命 ×1.35 · 伤害 +2 · 战利品 ×1.25。致胜者，雾亦让路', special: 'set_diff', diff: 1 },
    ],
  },

  prologue: {
    onEnter: (s) => { Note.add(s, 'night_star'); },
    text: '（装备与卡牌已放入行囊。点击左侧面板可随时查看。）\n\n镇外的界碑歪在雾里。碑旁，一个绿皮身影正翻检一具商队的尸骸——哥布林。\n\n它抬起头，喉咙里滚出低吼。\n雾隐镇就在前方。但眼下，得先过这一关。',
    choices: [
      { text: '⚔️ 拔出武器，迎战', sub: '教学战斗：打出卡牌，消灭敌人', combat: 'goblin_scout', win: 'arrival' },
      {
        text: '🌫️ 压低身形，借雾绕行', sub: '🎲 敏捷检定 · DC 8',
        check: { stat: 'agi', dc: 8 },
        success: { text: '你屏住呼吸，像一缕雾贴着界碑滑了过去。哥布林的呼噜声消失在身后。', go: 'arrival' },
        fail: { text: '脚下的枯枝咔嚓一响！哥布林怪叫着扑了过来！', combat: 'goblin_scout', win: 'arrival' },
      },
    ],
  },

  arrival: {
    text: '雾隐镇比传闻中更沉默。\n\n石板路，挂着风铃的屋檐，以及无处不在的薄雾。镇民行色匆匆，没有人交谈。\n\n广场的告示板上钉着一张泛黄的悬赏：\n【矿坑异动，募勇者调查，酬金从优】\n\n你决定先四处走走。',
    choices: [
      { text: '🏛️ 前往镇中心', go: 'town' },
    ],
  },

  /* ============ 第一章 · 雾隐镇 ============ */
  town: {
    text: (s) => {
      if (!s.flags.quest) {
        return '镇中心。风铃在没有风的雾里轻响。\n\n告示板前的悬赏还没人揭。铁匠铺的锤声、酒馆的喧闹、镇长府紧闭的门——都在等你。\n\n（右下角记录栏可查看过往事件；左侧面板可使用物品。）';
      }
      return '镇中心。北门已经为你放行。\n\n是时候动身了——但铁匠铺和酒馆仍然开着门，客栈的床铺也还温热。';
    },
    choices: [
      { text: '⚒️ 铁匠铺', sub: '购买装备与补给', go: 'smith' },
      { text: '🍺 雾语酒馆', sub: '打探消息', go: 'tavern' },
      { text: '🎐 铃语斋', sub: '风铃匠的铺子', go: 'chimes' },
      { text: '🏛️ 镇长府', sub: '拜见镇长艾德温', go: 'elder' },
      {
        text: '🛏️ 客栈歇脚', sub: '花费 10 金币，恢复全部生命',
        fx: { gold: -10, healPct: 100 }, requireGold: 10,
        disabled: (s) => s.player.hp >= s.player.maxHp,
        subFn: (s) => s.player.hp >= s.player.maxHp ? '生命已满，无需休息' : null,
        show: (s) => s.player.hp < s.player.maxHp || s.player.gold >= 10,
        go: 'town',
      },
      {
        text: '🚪 镇口哨卫', subFn: (s) => s.flags.quest ? '出镇北行' : '北门封闭中',
        go: 'gate',
      },
    ],
  },

  smith: {
    /* 文本在 onEnter 之前求值，因此这里读到的是"本次进入之前"的状态 */
    text: (s) => s.flags.inSmith
      ? '炉火还是那么旺。布洛克把锤子搁在砧上，甩了甩手腕：\n\n"又来了？货都摆着，自己看。钱货两清——别跟我聊星坠的事，我这把老骨头还想多活几年。"'
      : '炉火映红半面墙。铁匠布洛克头也不抬：\n\n"外乡人？星坠之后来的人，你是第七个。前六个……嗯，自己看货吧。"',
    onEnter: (s) => { s.flags.inSmith = true; },
    choices: [
      { text: '🧪 治疗药水 —— 30 金币', sub: '恢复 25 点生命', fx: { gold: -30, item: 'potion' }, requireGold: 30, go: 'smith' },
      { text: '🗡️ 精铁长剑 —— 60 金币', sub: '武器 · 攻击伤害 +2（替换锈蚀短剑）', fx: { gold: -60, gear: 'iron_sword' }, requireGold: 60, show: (s) => s.player.gear.weapon !== 'iron_sword', go: 'smith' },
      { text: '🥋 硬皮甲 —— 55 金币', sub: '护甲 · 护甲值 +2（替换粗布衣）', fx: { gold: -55, gear: 'leather_armor' }, requireGold: 55, show: (s) => s.player.gear.armor !== 'leather_armor', go: 'smith' },
      { text: '📿 力量护符 —— 65 金币', sub: '饰品 · 力量 +1', fx: { gold: -65, gear: 'amulet_pow' }, requireGold: 65, once: 'bought_pow', go: 'smith' },
      { text: '🧤 迅捷护腕 —— 65 金币', sub: '饰品 · 敏捷 +1', fx: { gold: -65, gear: 'amulet_agi' }, requireGold: 65, once: 'bought_agi', go: 'smith' },
      { text: '✨ 星屑香囊 —— 85 金币', sub: '遗物 · 开战时全体敌人易伤 1 层', fx: { gold: -85, relic: 'star_pouch' }, requireGold: 85, show: (s) => !hasRelic(s, 'star_pouch'), go: 'smith' },
      { text: '💍 荆棘指环 —— 110 金币', sub: '遗物 · 受击反弹 3 点伤害', fx: { gold: -110, relic: 'thorn_ring' }, requireGold: 110, show: (s) => !hasRelic(s, 'thorn_ring'), go: 'smith' },
      { text: '🂠 卡牌【破甲】—— 80 金币', sub: '加入牌组：1 费 · 4 伤 + 2 易伤', fx: { gold: -80, card: 'pierce' }, requireGold: 80, once: 'bought_pierce', go: 'smith' },
      { text: '↩️ 回到镇中心', go: 'town' },
    ],
  },

  tavern: {
    text: '酒馆里烟雾缭绕。吟游诗人的琴声有气无力，角落里的矿工们灌着黑麦酒，谁也不说话。\n\n老板娘擦着杯子朝你扬了扬下巴：想打听事？总得有点诚意。',
    choices: [
      {
        text: '💬 请全桌喝一轮', sub: '花费 15 金币 · 必得情报',
        fx: { gold: -15, item: 'miner_note', flag: 'intel', note: 'tavern_rumor' }, requireGold: 15, once: 'tavern_paid',
        go: 'tavern',
      },
      {
        text: '👂 凑过去听墙角', sub: '🎲 魅力检定 · DC 12',
        check: { stat: 'cha', dc: 12 },
        success: { text: '你笑着接上矿工们的话茬，几杯下肚，有人拍着你的肩吐了真言："矿坑第七巷……墙里有心跳声……"', fx: { item: 'miner_note', flag: 'intel', note: 'tavern_rumor' }, go: 'tavern' },
        fail: { text: '没人理会外乡人。你听了半个时辰，只听到满屋的酒嗝。', go: 'tavern' },
      },
      {
        text: '📖 听吟游诗人唱古塔的歌谣', once: 'tavern_lore',
        go: 'tavern_lore',
      },
      { text: '↩️ 回到镇中心', go: 'town' },
    ],
  },

  tavern_lore: {
    onEnter: (s) => { Note.add(s, 'tavern_lore'); },
    text: '诗人拨响一根低弦：\n\n"百年前，守塔人莫尔甘于塔顶封印影魔，以星核为锁，以性命为钥。\n此后雾锁小镇，再无人登塔。\n\n……直到那颗星星，砸穿了锁。"',
    choices: [
      { text: '……', go: 'tavern' },
    ],
  },

  chimes: {
    text: (s) => s.flags.inChimes
      ? '"又是你。"聋伯手里的锉刀没停，"东西摆着，自己挑。"'
      : '巷子深处有一间挂满风铃的小屋——几十只风铃，竟一只都不响。\n\n老匠人背对着你锉一枚铃舌，头也不回："想买就进来。别问铃为什么不响——我聋，它们哑，正好凑一对。"',
    onEnter: (s) => { s.flags.inChimes = true; return null; },
    choices: [
      { text: '🂠 卡牌【清铃音】—— 70 金币', sub: '加入牌组：1 费 · 清除负面状态 + 抽 1 张牌', fx: { gold: -70, card: 'chime' }, requireGold: 70, once: 'bought_chime', go: 'chimes' },
      { text: '🔔 银铃舌 —— 50 金币', sub: '遗物 · 战斗开始时获得 3 点护甲', fx: { gold: -50, relic: 'silver_tongue' }, requireGold: 50, show: (s) => !hasRelic(s, 'silver_tongue'), go: 'chimes' },
      { text: '📿 守夜风铃 —— 60 金币', sub: '饰品 · 护甲值 +1（铃音结界）', fx: { gold: -60, gear: 'night_chime' }, requireGold: 60, show: (s) => s.player.gear.charm !== 'night_chime', go: 'chimes' },
      { text: '🎧 请聋伯敲一段老铃', sub: '铃音涤荡疲惫 · 恢复 20% 生命', once: 'chime_bless', fx: { healPct: 20 }, go: 'chimes' },
      { text: '❓ 询问风铃的来历', sub: '满屋哑掉的铃，总有个缘故', once: 'asked_chimes', fx: { note: 'chime_lore' }, go: 'chimes' },
      {
        text: '🌀 忘却之铃 —— 40 金币', sub: '聋伯的铃音能让人忘却：从牌组中移除 1 张卡牌',
        special: 'forget_card', requireGold: 40,
        disabled: (s) => s.deck.length <= 6,
        subFn: (s) => s.deck.length <= 6 ? '牌组至少保留 6 张' : null,
        go: 'chimes',
      },
      { text: '↩️ 回到镇中心', go: 'town' },
    ],
  },

  elder: {
    text: '镇长艾德温比他的年岁苍老得多。他摊开一张矿坑图，指节抵在第三层的位置，久久没有说话。\n\n"星坠石砸穿了矿坑三层。七名矿工失踪。雾一天比一天浓——若异变蔓延，雾隐镇撑不过这个冬天。"\n\n他推来一袋金币："这是预付。带上它，也带上我的恳求。"',
    onEnter: (s) => {
      if (!s.flags.quest) { s.flags.quest = true; s.player.gold += 50; Quest.add(s, 'main_mine'); return '【任务更新：调查迷雾矿坑】\n【获得 50 金币（预付酬金）】'; }
      return null;
    },
    choices: [
      { text: '🤝 "我会带回答案。"', go: 'town' },
      {
        text: '❓ 追问古塔与守塔人的往事', sub: '🎲 智力检定 · DC 11', once: 'elder_lore',
        check: { stat: 'int', dc: 11 },
        success: { text: '艾德温浑浊的眼睛亮了一下："塔顶封印着影魔……而星核，是锁。你明白这意味着什么吗？那颗坠落的星，砸开的不只是矿坑。"', fx: { note: 'elder_secret' }, go: 'town' },
        fail: { text: '"老人们的胡话罢了。"他摆摆手，神色疲惫，"去吧，年轻人。矿坑在等你。"', go: 'town' },
      },
    ],
  },

  gate: {
    text: (s) => s.flags.quest
      ? '北门的哨卫看清你腰间的镇长徽记，沉默地拉开拒马。\n\n"星坠之后，进去的人没几个出来。"他顿了顿，"愿风铃保佑你。"'
      : '哨卫的长枪横在你面前："北门封了。镇长有令——星坠之事，闲人免进。"\n\n（或许该先去镇长府看看告示的悬赏。）',
    choices: [
      { text: '🛤️ 出镇北行', show: (s) => !!s.flags.quest, go: 'crossroads' },
      { text: '↩️ 回到镇中心', show: (s) => !s.flags.quest, go: 'town' },
      { text: '↩️ 最后补给一次再走', show: (s) => !!s.flags.quest, go: 'town' },
    ],
  },

  /* ============ 第二章 · 荒野之路 ============ */
  crossroads: {
    text: '出镇北行，道路在鹰嘴崖分作两股：\n\n左手是兽径纵横的黑松林，雾在枝叶间流动，隐约有狼嚎。\n右手是风蚀的碎石山道，崖顶立着几道歪斜的图腾。\n\n两条路都通往矿坑。',
    choices: [
      { text: '🌲 走黑松林', sub: '潜行与陷阱', go: 'forest' },
      { text: '⛰️ 走碎石山道', sub: '埋伏与谈判', go: 'mountain' },
      { text: '🦌 猎人小径', sub: '星屑微光 · 未知的支线', go: 'grove_path' },
    ],
  },

  forest: {
    text: '松林里雾更浓了。兽径上散落着白骨，骨头上刻着整齐的齿痕。\n\n前方林间隐约可见数道细如发丝的反光——猎人设下的陷阱，或是哥布林的恶作剧。',
    choices: [
      {
        text: '🌿 贴着兽径，轻步穿行', sub: '🎲 敏捷检定 · DC 11',
        check: { stat: 'agi', dc: 11 },
        success: { text: '你像鹿一样跃过兽夹、避开绊索，鞋底连一粒砂都没惊动。', go: 'forest_wolf' },
        fail: { text: '咔哒——兽夹咬住了你的小腿！你咬牙撬开铁齿，血珠渗进泥土。（生命 -8）', fx: { hp: -8 }, combat: 'wolf_pack', win: 'forest_treasure' },
      },
      {
        text: '🪓 拔刀砍开一条路', sub: '笨办法，但有效',
        go: 'forest_wolf',
      },
    ],
  },

  forest_wolf: {
    text: '穿出荆棘丛的瞬间，三道灰影从雾里围拢。\n\n巨狼。饿了一冬的巨狼。\n\n头狼压低前肢，喉咙里滚出雷声。',
    choices: [
      { text: '⚔️ 迎战狼群', combat: 'wolf_pack', win: 'forest_treasure' },
    ],
  },

  forest_treasure: {
    onEnter: (s) => {
      const msg = [];
      if (!s.flags.forest_loot) {
        s.flags.forest_loot = true;
        s.player.gold += 45;
        s.items.firebomb = (s.items.firebomb || 0) + 1;
        s.player.gear.charm = 'wolf_fang';
        s.relics = s.relics || [];
        if (!hasRelic(s, 'wolf_whistle')) s.relics.push('wolf_whistle');
        msg.push('【获得 45 金币 / 火焰瓶 ×1 / 饰品·狼王獠牙（力量+1）/ 遗物·狼骨哨】');
      }
      return msg.length ? msg.join('\n') : null;
    },
    text: '狼群守护的树洞里藏着它们的"家当"：一袋铜币、一瓶火油，还有一枚泛着寒光的巨大獠牙。獠牙旁边，一支骨哨静静躺着——吹响它，整片松林都会屏住呼吸。\n\n雾在树洞后散开——山道尽头，矿坑漆黑的入口已经遥遥在望。',
    choices: [
      { text: '⛏️ 前往矿坑入口', go: 'mine_entrance' },
    ],
  },

  mountain: {
    text: '山道碎石嶙峋。转过鹰嘴崖，几个绿皮劫掠者从图腾后站起，明晃晃的弯刀拦住去路。\n\n为首的独眼哥布林咧开嘴："留下钱袋子，或者留下脑袋。"',
    choices: [
      { text: '⚔️ "放马过来。"', combat: 'bandits', win: 'mountain_win' },
      {
        text: '💪 单手举起崖边的巨石', sub: '🎲 力量检定 · DC 12',
        check: { stat: 'pow', dc: 12 },
        success: { text: '巨石在你掌中咯咯作响。独眼哥布林的笑容僵住——绿皮们丢下一小袋赃款，屁滚尿流地逃进了雾里。', fx: { gold: 20 }, go: 'mine_entrance' },
        fail: { text: '巨石纹丝不动，只蹭掉你一手皮。绿皮们哄笑着一拥而上！', combat: 'bandits', win: 'mountain_win' },
      },
      {
        text: '🧗 沿崖壁绕行', sub: '多花一个时辰，避开战斗',
        go: 'mine_entrance',
      },
    ],
  },

  mountain_win: {
    onEnter: (s) => {
      if (!s.flags.mtn_loot) { s.flags.mtn_loot = true; s.player.gold += 35; Note.add(s, 'mine_map'); return '【获得 35 金币】'; }
      return null;
    },
    text: '劫掠者的赃物袋里有些零钱，还有半张潮湿的矿坑地图——地图上，第七巷被红炭笔圈了三圈。\n\n风从矿坑的方向吹来，带着铁锈与腐土的气味。',
    choices: [
      { text: '⛏️ 前往矿坑入口', go: 'mine_entrance' },
    ],
  },

  /* ============ 支线 · 星陨林 ============ */
  grove_path: {
    text: '岔路口的兽径尽头，雾忽然稀薄了。\n\n林间的空气泛着极淡的甜味。倒伏的枯木上生满发光的苔藓，一明一灭，像谁遗落的星屑还在呼吸。\n\n远处，溪水声与捣药声隐约可闻。而林子更深处，雾浓得化不开——那里有低语。',
    choices: [
      { text: '🏚️ 探访捣药声的小屋', sub: '有烟火气', go: 'grove_hut' },
      { text: '💠 循着苔藓微光走向林心', sub: '雾最浓处 · 低语的源头', go: 'grove_heart_pre' },
      { text: '🦌 循着溪边的新鲜蹄印', sub: '林子里还有别的活物', go: 'grove_stag' },
      { text: '🌿 拨开雾蔓，探查窸窣声', sub: '遭遇战', combat: 'grove_wisps', win: 'grove_path' },
      { text: '↩️ 返回岔路口', go: 'crossroads' },
    ],
  },

  grove_hut: {
    /* 文本先于 onEnter 求值：首访/再访/净化完成后 三态 */
    text: (s) => s.flags.springDone
      ? '小屋前的药架重新挂满了青绿的束草。雾葵把一枝星苜蓿别在你行囊上：\n\n"泉水清了，山就还有救。……拿着这枝花，路上泡水喝。"\n\n她重新埋首于药臼。捣杵声不紧不慢，像许多年前一样。'
      : s.flags.inGroveHut
        ? '捣杵声一下、一下。雾葵头也不抬：\n\n"泉眼在林心，顺着发光的苔藓走就是。……答应的事，可别忘了。"'
        : '林间空地上歪着一座苔藓小屋，屋檐下挂满干草药束。\n\n佝偻的老药婆没有回头："站在门口做什么？星屑的气味熏了你一身——进来吧，外乡人。"',
    onEnter: (s) => {
      if (!s.flags.inGroveHut) { s.flags.inGroveHut = true; Quest.add(s, 'side_grove'); return '【支线任务：林心的异光】'; }
      return null;
    },
    choices: [
      { text: '🌿 药婆的草香囊 —— 55 金币', sub: '遗物 · 每回合开始恢复 1 点生命', fx: { gold: -55, relic: 'herb_pouch' }, requireGold: 55, show: (s) => !hasRelic(s, 'herb_pouch'), go: 'grove_hut' },
      { text: '💊 接下委托，前往林心', sub: '让泉水重新清澈', show: (s) => !s.flags.springDone, go: 'grove_heart_pre' },
      { text: '❓ 询问星坠之夜的事', sub: '老人们总知道些什么', once: 'asked_grove', fx: { note: 'grove_lore' }, go: 'grove_hut' },
      { text: '↩️ 告别，回到林间空地', go: 'grove_path' },
    ],
  },

  grove_heart_pre: {
    text: '林心是一片凹陷的浅潭。\n\n泉底沉着一点微光，像沉在水里的小小星星。而泉上盘着一团浓得发稠的黑雾——它没有眼睛，你却清晰地感觉到，它在看你。\n\n"来啦……"雾里渗出一个甜腻的声音，"守着这滩死水的老太婆，让你来做什么？"',
    choices: [
      { text: '💬 听它说什么', sub: '低语从来不安好心', go: 'wisp_deal' },
      {
        text: '🧘 依着酒馆古谣的调子，诵念净泉咒文', sub: '🎲 智力检定 · DC 13',
        check: { stat: 'int', dc: 13 },
        success: { text: '古谣的音节拼出了百年前的封印咒文。黑雾发出一声不甘的尖啸，像退潮般缩回泉底的微光里——潭水以肉眼可见的速度变得清澈。', go: 'wisp_win' },
        fail: { text: '你念错了半个音节。黑雾骤然膨胀，潭水沸腾般翻涌起来——无数条雾之触手自水中立起！', combat: 'wisp_echo', win: 'wisp_win' },
      },
      { text: '⚔️ 不听，直接动手', sub: '精英战 · 林心低语者', combat: 'wisp_echo', win: 'wisp_win' },
      { text: '↩️ 退回林间空地', go: 'grove_path' },
    ],
  },

  wisp_deal: {
    text: '"小东西……"雾在你耳边凝成一张笑着的嘴。\n\n"泉底那点微光困了我百年。替我摘下它，我便教你让血肉燃起星火的秘法。\n\n——反正，这镇子的雾，又不是我造的。"',
    choices: [
      { text: '🩸 "成交。"', sub: '获得禁忌卡牌 · 泉水将保持污浊', fx: { card: 'mist_pact', flag: 'wispDeal', note: 'wisp_pact' }, go: 'grove_path' },
      { text: '✋ "泉底的，才是受害者。"', go: 'grove_heart_pre' },
    ],
  },

  wisp_win: {
    onEnter: (s) => {
      if (s.flags.springDone) return null;
      s.flags.springDone = true;
      s.items.star_dew = (s.items.star_dew || 0) + 1;
      s.deck.push('star_dust');
      s.relics = s.relics || [];
      if (!hasRelic(s, 'bone_flute')) s.relics.push('bone_flute');
      Quest.done(s, 'side_grove');
      Note.add(s, 'spring_pure');
      if (!s.player.gear.charm) {
        s.player.gear.charm = 'star_speaker';
        return '【获得 星辉露珠 ×1 / 卡牌【星屑飞尘】/ 遗物·低语的骨笛 / 饰品·星语者徽记（魅力+1）】\n【支线完成：林心的异光】';
      }
      s.player.gold += 40;
      return '【获得 星辉露珠 ×1 / 卡牌【星屑飞尘】/ 遗物·低语的骨笛 / 40 金币（谢礼）】\n【支线完成：林心的异光】';
    },
    text: '低语散尽的瞬间，泉底那点微光浮上水面，碎成满潭星屑。\n\n潭水清冽得能照见树冠——泉底的淤泥里，躺着一支细小的骨笛，笛孔的排布不似人间手笔。潭水许你把它带走：低语散了，笛声便只为你一人响。\n\n归途的方向，药草与炊烟的气味隐约传来。',
    choices: [
      { text: '🏚️ 回药婆小屋道谢', go: 'grove_hut' },
      { text: '↩️ 返回林间空地', go: 'grove_path' },
    ],
  },

  grove_stag: {
    text: '溪水在青石上分成细流。\n\n一只鹿立在浅滩中央——如果那还能算鹿：双角如雾凝成，蹄下不见涟漪，唯有角尖坠着几点星屑似的微光。\n\n它转过头。漆黑的眼睛里，映着你的影子。',
    choices: [
      {
        text: '🤫 垂首侧身，学鹿群示好的姿态', sub: '🎲 敏捷检定 · DC 12',
        check: { stat: 'agi', dc: 12 },
        success: { text: '你放缓呼吸，垂下肩颈，把杀气收进鞘里。巨鹿凝视你良久，温热的鼻息拂过手背——它侧身让开溪道，角尖的微光轻轻碰了碰你的额头。', fx: { healPct: 100, card: 'star_blessing' }, go: 'grove_path' },
        fail: { text: '脚下的碎石一滑。巨鹿一声长嘶，浓雾自角尖炸开——它低下头，巨角直指着你！', combat: 'mist_stag', win: 'stag_win' },
      },
      { text: '⚔️ 猎下这副雾角', sub: '它在雾里值钱', combat: 'mist_stag', win: 'stag_win' },
      { text: '↩️ 悄悄退开', go: 'grove_path' },
    ],
  },

  stag_win: {
    onEnter: (s) => {
      if (!s.flags.stagLoot) { s.flags.stagLoot = true; s.player.gold += 35; s.items.energy_potion = (s.items.energy_potion || 0) + 1; return '【获得 35 金币 / 能量药水 ×1】'; }
      return null;
    },
    text: '雾角鹿轰然侧倒，化作漫天萤火般的星屑——它没有留下尸体，只有一双凝成实的雾角，静静躺在青石上。\n\n溪水重新流动起来。',
    choices: [
      { text: '↩️ 返回林间空地', go: 'grove_path' },
    ],
  },

  /* ============ 第三章 · 迷雾矿坑 ============ */
  mine_entrance: {
    text: '矿坑入口像一张半开的嘴。锈死的轨道车歪在坡底，"雾隐矿业"的木牌上爬满黑苔。\n\n岩缝里渗出一泓泉水，清冽，在幽暗里微微发亮——或许是山上下来的活水，尚未被污染。',
    choices: [
      {
        text: '💧 掬泉水畅饮，恢复全部生命', sub: '泉水澄澈，值得信任', once: 'spring_drunk',
        fx: { healPct: 100 }, go: 'mine_entrance',
      },
      { text: '🕯️ 深入矿坑', go: 'mine_depths' },
      { text: '🏠 返回雾隐镇', sub: '补给与休整', go: 'town' },
    ],
  },

  mine_depths: {
    onEnter: (s) => { if (!s.flags.q_miner) { s.flags.q_miner = true; Quest.add(s, 'side_miner'); } },
    text: (s) => s.flags.bossDown
      ? '矿坑一层。巨虫的尸骸已被雾气包裹。墙中的搏动停止了——但更深处的古塔方向，似乎有什么仍在苏醒。'
      : '矿坑一层。镐子散落一地，轨道锈死在半途。\n\n深处隐约有搏动声，缓慢、沉重，像一颗埋在山腹里的巨大心脏。\n\n（战胜敌人可获得金币、经验与卡牌奖励。）',
    choices: [
      { text: '🕯️ 探索隧道', sub: '遭遇战', combat: 'random:mine', win: 'depths_after' },
      { text: '👂 聆听墙中的搏动', sub: '🎲 智力检定 · DC 11', once: 'listened_wall',
        check: { stat: 'int', dc: 11 },
        success: { text: '你把手贴上岩壁。搏动的节律……有规律！循着节律摸索，一处暗门訇然开启——前任矿监的私库！', go: 'secret_room' },
        fail: { text: '指尖刚触到岩壁，渣土簌簌而落——一具骷髅从墙里立了起来，眼窝里燃着幽火！', combat: 'skeleton_spider', win: 'depths_after' },
      },
      { text: '🆘 循着呼救声前进', sub: '有人还活着', once: 'miner_done', go: 'rescue_pre' },
      {
        text: '🧱 走进搏动最响的第七巷', subFn: (s) => (s.flags.intel || s.flags.mine_map) ? '传闻与地图指向的尽头' : '心口的搏动在牵引你',
        go: 'seventh_tunnel',
      },
      { text: '🕳️ 深入三层', subFn: (s) => s.flags.bossDown ? '下层已被迷雾封死' : '搏动声的源头', show: (s) => !s.flags.bossDown, go: 'mine_heart_pre' },
      { text: '↩️ 退回矿坑入口', go: 'mine_entrance' },
    ],
  },

  secret_room: {
    onEnter: (s) => {
      if (!s.flags.secret_room) {
        s.flags.secret_room = true;
        s.player.gold += 80;
        s.items.energy_potion = (s.items.energy_potion || 0) + 1;
        s.relics = s.relics || [];
        if (!hasRelic(s, 'coin_star')) s.relics.push('coin_star');
        Note.add(s, 'mine_log');
        return '【获得 80 金币 / 能量药水 ×1 / 遗物·坠星铜币】';
      }
      return null;
    },
    text: '密室里的烛台早已冷透，但抽屉里的铜币依旧擦得锃亮。墙上的矿监日志只写了一半：\n\n"第七巷的墙不是墙。它在呼吸。我们凿穿了三层，矿工说下面有光——不该有光的。……如果你看到这本日志，带上电光瓶，然后跑。"',
    choices: [
      { text: '🤫 带上财物，原路返回', go: 'mine_depths' },
    ],
  },

  rescue_pre: {
    text: '"救……救命——"\n\n微弱的呼救从坍塌的巷道后传来，夹杂着窸窸窣窣的爬行声。\n\n你劈开碎木——一名矿工被压在车底，而他周围的黑暗里，无数只眼睛泛着绿光。',
    choices: [
      { text: '⚔️ 斩杀毒蛛，救出矿工', combat: 'spiders', win: 'rescue_win' },
    ],
  },

  rescue_win: {
    onEnter: (s) => {
      if (!s.flags.minerSaved) {
        s.flags.minerSaved = true;
        s.deck.push('first_aid');
        Quest.done(s, 'side_miner');
        Note.add(s, 'miner_warning');
        if (!s.player.gear.charm) {
          s.player.gear.charm = 'miner_lamp';
          return '【获得 饰品·矿工的头灯（智力+1）/ 卡牌【急救】】';
        }
        s.player.gold += 30;
        return '【获得 卡牌【急救】/ 30 金币（谢礼）】';
      }
      return null;
    },
    text: '老矿工托马斯瘫坐在地，怀里死死抱着一只矿灯。\n\n"第七巷的墙里有东西在跳……别信它说的话。"他把矿灯塞进你手里，"拿去。它照过的路，我都活着走回来过。"\n\n他还教你一套战场包扎的手法。',
    choices: [
      { text: '🤝 扶他撤往入口，继续探索', go: 'mine_depths' },
    ],
  },

  depths_after: {
    text: '你清点战利品，靠着朽坏的支柱稍作喘息。\n\n雾从巷道深处漫上来，搏动声愈发清晰。',
    choices: [
      { text: '↩️ 返回矿坑一层', go: 'mine_depths' },
    ],
  },

  /* ============ 支线 · 第七巷 ============ */
  seventh_tunnel: {
    onEnter: (s) => {
      if (!s.flags.q_wall) { s.flags.q_wall = true; Quest.add(s, 'side_wall'); }
      return null;
    },
    text: '第七巷比别的巷道更窄，也更冷。\n\n巷口的空地上散落着六套锈烂的行囊——剑、弓、法杖，还有几块没能带回家的腰牌。矿监日志没有写错：这里就是尽头。\n\n巷道尽头的墙面随搏动隆起、塌陷，隆起、塌陷。六套行囊的主人，没有一个走出去。',
    choices: [
      { text: '🔥 把火焰瓶掷向墙面', sub: '矿监日志说"带上它"——正着用', show: (s) => (s.items.firebomb || 0) > 0, fx: { useItem: 'firebomb' }, go: 'seventh_heart' },
      { text: '🪓 劈开搏动的墙', sub: '会惊动墙里的东西', combat: 'wall_spawns', win: 'seventh_heart' },
      {
        text: '👂 贴墙倾听', sub: '🎲 智力检定 · DC 12', once: 'heard_names',
        check: { stat: 'int', dc: 12 },
        success: { text: '低语一遍遍念着六个名字。数到第七个时——它停了一下，像是在等你补上。', fx: { note: 'wall_whisper' }, go: 'seventh_tunnel' },
        fail: { text: '心跳骤然放大，整条巷道随之震颤！你踉跄着后退，耳中嗡嗡作响。（生命 -6）', fx: { hp: -6 }, go: 'seventh_tunnel' },
      },
      { text: '↩️ 退回矿坑一层', go: 'mine_depths' },
    ],
  },

  seventh_heart: {
    text: '墙后是一个你没料到的洞窟——大得能听见回声。\n\n六顶帐篷塌在洞边，火塘早已冷透。行囊大多空了，角落里却有一只锁箱，完好无损——它没有上锁，像是留给来者的。\n\n洞窟深处的裂缝里垂下无数苍白的须。墙中之物的心跳，在这里响得像战鼓。',
    choices: [
      { text: '🎁 收拢六人的遗物', sub: '愿他们安息', once: 'seventh_loot', fx: { gold: 90, item: 'big_potion', relic: 'keeper_monocle' }, go: 'seventh_heart' },
      { text: '⚔️ 面对墙中之物', sub: '头目战 · 墙里的心跳', combat: 'wall_thing', win: 'seventh_win' },
      { text: '↩️ 带着遗物撤退', sub: '有些东西，不该被吵醒', go: 'mine_depths' },
    ],
  },

  seventh_win: {
    onEnter: (s) => {
      if (s.flags.wallDone) return null;
      s.flags.wallDone = true;
      s.deck.push('echo_strike');
      s.relics = s.relics || [];
      if (!hasRelic(s, 'wine_flask')) s.relics.push('wine_flask');
      Note.add(s, 'sixth_fate');
      Quest.done(s, 'side_wall');
      return '【获得 卡牌【六人斩】/ 遗物·六人队的酒壶】\n【支线完成：墙中的心跳】';
    },
    text: '墙中之物炸裂成漫天尘屑，六个声音同时叹了口气。\n\n六道残影自尘屑中站起——剑士、弓手、法师……他们朝你一齐颔首，把手中的技艺留在你掌心。最后一名残影把一只旧酒壶放进你的手里——壶底还剩最后一口酒。\n随后，他们化光散去。\n\n最深处的裂缝里，第七套行囊叠得整整齐齐。第六人没有死——他放下了剑，自己沿着裂缝走了进去，再没有回头。',
    choices: [
      { text: '↩️ 返回矿坑一层', go: 'mine_depths' },
    ],
  },

  mine_heart_pre: {
    text: '矿坑三层——眼前豁然开阔。\n\n洞穴中央，一颗拳头大的晶体悬浮在半空，幽幽旋转。晶体之下，岩土隆起、翻涌——\n\n一头山丘般的巨虫破土而出，独眼里映着你的影子。',
    choices: [
      { text: '⚔️ 决一死战', sub: '头目战 · 矿坑之王', combat: 'boss_worm', win: 'worm_win' },
    ],
  },

  worm_win: {
    onEnter: (s) => {
      if (!s.flags.bossDown) {
        s.flags.bossDown = true;
        s.items.star_shard = 1;
        s.relics = s.relics || [];
        if (!hasRelic(s, 'worm_eye')) s.relics.push('worm_eye');
        Quest.done(s, 'main_mine');
        Quest.add(s, 'main_tower');
        return '【获得 任务物品·星核碎片 / 遗物·王虫的独眼（行动力上限 +1，每战开始失去 3 生命）/ 大量经验】';
      }
      return null;
    },
    text: '巨虫轰然倒地，激起漫天尘雾。\n\n星核碎片落入你的掌心。它温热，像一颗小小的心脏，与远处古塔的方向遥遥呼应。\n\n而巨虫碎裂的头颅深处，一枚独眼般的晶珠兀自转动——它隔着百丈岩层看了你一眼，然后，把某种沉甸甸的"时间"压进了你的血脉。拿住它，它就是力量；拿不住，它就叫疼。\n\n轰隆——矿坑开始坍塌。你夺路狂奔，身后巷道接连崩落。',
    choices: [
      { text: '🌞 冲回地面', go: 'core_choice' },
    ],
  },

  /* ============ 抉择 · 星核 ============ */
  core_choice: {
    onEnter: (s) => { Note.add(s, 'core_whisper'); },
    text: '回到地面，夕阳正沉入雾海。\n\n碎片在你掌中低语。它有三种诉求：被净化，被吞噬，或被永远封存。\n\n而无论哪种选择，古塔都在北方山巅注视着你。',
    choices: [
      {
        text: '🧘 尝试净化它', sub: '🎲 智力检定 · DC 14',
        check: { stat: 'int', dc: 14 },
        success: { text: '你以百年前的净化咒文为引，月光为砥。黑雾如潮水般从碎片中退去——它变得澄澈，像一小片凝固的星空。', fx: { flag2: { core: 'pure' }, card: 'purify', healPct: 100 }, go: 'tower_gate' },
        fail: { text: '黑雾顺着指尖倒灌而入！你咬碎牙关，用血肉做引、以剧痛为砥，硬生生把整片黑雾从碎片里逼了出去——碎片终究是澄澈了，只是你手臂上多了一道再也褪不掉的焦痕。（生命 -12）', fx: { hp: -12, flag2: { core: 'pure' }, card: 'purify' }, go: 'tower_gate' },
      },
      { text: '🩸 吸收它的力量', sub: '禁忌之力', go: 'absorb_confirm' },
      { text: '🕊️ 封存碎片，交回镇上', sub: '就此归乡', go: 'peace_confirm' },
    ],
  },

  absorb_confirm: {
    text: '你凝视着碎片。黑暗在晶体深处盘旋，像在应和你血液里的冲动。\n\n这不洁净的力量将永远改变你。真的要这么做吗？',
    choices: [
      {
        text: '🩸 "我要亲手终结这一切。"', fx: { flag2: { core: 'absorb' }, card: 'shadow_rage', stat: { pow: 1 } },
        go: 'tower_gate',
      },
      { text: '✋ 再想想', go: 'core_choice' },
    ],
  },

  peace_confirm: {
    text: '把碎片交回去，意味着把秘密也交出去。\n\n雾或许不会散。但至少，镇子上的人们能睡个安稳觉。\n\n——确定就此结束冒险吗？（将进入结局）',
    choices: [
      { text: '🕊️ 是的，带它回雾隐镇', go: 'ending_peace' },
      { text: '✋ 再想想', go: 'core_choice' },
    ],
  },

  /* ============ 终章 · 古塔 ============ */
  tower_gate: {
    text: '古塔立于山巅，塔身缠绕着百年常青的黑雾。\n\n塔下，一名斗篷旅人拦住去路，兜帽下只露出下巴一线冷笑：\n\n"——前方是守塔人的领域。要赌命，先备货。"',
    choices: [
      { text: '🍶 大治疗药水 —— 65 金币', sub: '恢复 60 点生命', fx: { gold: -65, item: 'big_potion' }, requireGold: 65, once: 'shop_bp', go: 'tower_gate' },
      { text: '⏱️ 矿监的怀表 —— 80 金币', sub: '遗物 · 首回合多抽 1 张牌', fx: { gold: -80, relic: 'watch' }, requireGold: 80, show: (s) => !hasRelic(s, 'watch'), go: 'tower_gate' },
      { text: '⚡ 能量药水 —— 50 金币', sub: '战斗中 +2 行动力', fx: { gold: -50, item: 'energy_potion' }, requireGold: 50, once: 'shop_ep', go: 'tower_gate' },
      { text: '🌿 解毒草 —— 25 金币', sub: '战斗中清除负面状态', fx: { gold: -25, item: 'antidote' }, requireGold: 25, once: 'shop_ad', go: 'tower_gate' },
      { text: '🥋 锁子甲 —— 120 金币', sub: '护甲 · 护甲值 +3', fx: { gold: -120, gear: 'chain_mail' }, requireGold: 120, show: (s) => s.player.gear.armor !== 'chain_mail', go: 'tower_gate' },
      { text: '🂠 高阶卡牌 —— 100 金币', subFn: () => '职业限定 · 加入牌组', fx: { gold: -100, special: 'class_card' }, requireGold: 100, once: 'shop_card', go: 'tower_gate' },
      {
        text: '🔥 在旅人的篝火旁休整', sub: '恢复 50% 生命', once: 'tower_rest',
        fx: { healPct: 50 }, go: 'tower_gate',
      },
      { text: '🚪 踏入古塔', sub: '塔底大厅 · 百年的尘封', go: 'tower_hall' },
    ],
  },

  /* —— 古塔内部 —— */
  tower_hall: {
    text: '塔门在身后合拢，尘封百年的空气扑面而来。\n\n塔底大厅的穹顶绘满褪色的星轨，一道银沙漏自顶端垂落，仍在缓缓流转——这座塔的时间，似乎从没停止过。\n\n环形的墙壁上刻着一圈壁画，角落里散落着守塔人的遗物。旋梯自厅心盘旋而上，没入高处的阴影。',
    choices: [
      {
        text: '🎨 解读星轨壁画', sub: '🎲 智力检定 · DC 12', once: 'read_fresco',
        check: { stat: 'int', dc: 12 },
        success: { text: '壁画描绘着百年前的那一夜：守塔人将影魔钉入塔顶，星核化作锁链。最末一格，他独自坐在祭坛边，在塔门上刻下一行诗。', fx: { xp: 15, note: 'tower_fresco' }, go: 'tower_hall' },
        fail: { text: '星轨的刻线相互缠绕，你只能认出零星几个古字——大意是"锁"与"归还"。', go: 'tower_hall' },
      },
      { text: '🗝️ 搜查守塔人的遗物', sub: '尘封的壁龛', once: 'hall_loot', fx: { item: 'antidote', gold: 25, relic: 'map_shard' }, go: 'tower_hall' },
      { text: '🌌 登上环廊的观星台', sub: '古塔的中层 · 藏书室', go: 'tower_archive' },
      { text: '🌀 沿旋梯而上', sub: '星影游荡的中段', go: 'tower_stairs' },
    ],
  },

  tower_archive: {
    text: '观星台是一间环形藏书室。星图铺满四壁，其中一幅上，百年前的人用朱砂圈住了塔顶的位置。\n\n案几摊着一本手记，墨迹被岁月泡得发蓝。书架尽头，一台黄铜的星轨罗盘仍在滴答转动，唯独一根指针疯狂打转，像在寻找什么。',
    choices: [
      { text: '📜 研读守塔人的手记', sub: '泛蓝的墨迹', once: 'read_journal', fx: { note: 'keeper_journal', xp: 10 }, go: 'tower_archive' },
      {
        text: '🌠 校准星轨罗盘', sub: '🎲 智力检定 · DC 14', once: 'aligned_compass',
        check: { stat: 'int', dc: 14 },
        success: { text: '你依着星图的轨迹拨正指针。罗盘发出一声清鸣，一页夹藏的咒式弹了出来——那是守塔人誊录的星坠之力。', fx: { card: 'meteor' }, go: 'tower_archive' },
        fail: { text: '指针在你指间疯狂逆转，星轨的光烧灼着指尖！但你咬着牙，硬是在紊乱的光影里抓到了那一瞬的咒式。（生命 -8）', fx: { hp: -8, card: 'meteor' }, go: 'tower_archive' },
      },
      { text: '↩️ 回到塔底大厅', go: 'tower_hall' },
    ],
  },

  tower_stairs: {
    text: '旋梯绕着塔心一路向上。中段的阴影里，几点星屑般的光屑无风自动——\n\n星屑怨影。百年孤独凝成的执念，守着这条通往塔顶的路。\n\n更高处，透下猩红的光。',
    choices: [
      { text: '⚔️ 斩碎星影，登上旋梯', sub: '遭遇战', combat: 'tower_wraiths', win: 'tower_landing' },
      {
        text: '🤫 贴着塔心阴影潜行', sub: '🎲 敏捷检定 · DC 12',
        check: { stat: 'agi', dc: 12 },
        success: { text: '你把呼吸压到最轻，像一缕雾贴着塔心滑过。怨影的光屑在身后明灭，没有追来。', go: 'tower_landing' },
        fail: { text: '一片光屑落在你肩头，瞬间燃起！怨影们尖叫着从阴影里涌出！', combat: 'tower_wraiths', win: 'tower_landing' },
      },
      { text: '↩️ 退回塔底大厅', go: 'tower_hall' },
    ],
  },

  tower_landing: {
    text: '旋梯中段豁然开阔。\n\n一泓星尘泉水自石缝渗出，在天坑里积成浅浅一汪，泛着温润的微光。旋梯继续向上，猩红的光愈发刺眼。\n\n一处凹室里立着一座石像——它的独眼里，星轨还在缓缓转动。',
    choices: [
      { text: '⛲ 掬一口星尘泉水', sub: '恢复 60% 生命 · 一次', once: 'star_spring', fx: { healPct: 60 }, go: 'tower_landing' },
      { text: '🗿 对上凹室的星轨石像', sub: '精英战 · 它守着什么', combat: 'tower_guard', win: 'golem_win' },
      { text: '🚪 沿旋梯直上塔顶', sub: '塔顶 · 一去不返', go: 'tower_top' },
      { text: '↩️ 退回塔底大厅', go: 'tower_hall' },
    ],
  },

  golem_win: {
    onEnter: (s) => {
      if (!s.flags.golemLoot) {
        s.flags.golemLoot = true;
        s.player.gear.weapon = 'star_blade';
        s.relics = s.relics || [];
        if (!hasRelic(s, 'hourglass')) s.relics.push('hourglass');
        return '【武器·星辉长剑（攻击伤害 +3，替换旧武器）/ 遗物·星辉沙漏】';
      }
      return null;
    },
    text: '星轨石像轰然碎裂，散作一地星砂。\n\n碎裂的胸腔里，一柄长剑静静悬浮——剑身的星辉沉淀成实体，刃口流转着百年前的月光。剑旁立着一座黄铜沙漏，漏中的星屑明明灭灭，却永远流不尽。石像守了它们一百年，直到等来一个配得上它们的手。',
    choices: [
      { text: '🚪 沿旋梯直上塔顶', sub: '塔顶 · 一去不返', go: 'tower_top' },
      { text: '↩️ 退回旋梯中段', go: 'tower_landing' },
    ],
  },

  tower_top: {
    onEnter: (s) => { Note.add(s, 'morgan_words'); },
    text: '塔顶是一座巨大的环形祭坛，星轨刻满石台。\n\n守塔人莫尔甘背对你而立，半边身躯已被黑雾吞没。塔心的悬浮基座空空如也——星核本该在那里。\n\n"你来了……带着我的星核。"他的声音像两个人在同时说话。\n"把它交给我。或者，成为塔的一部分。"',
    choices: [
      {
        text: '🕊️ 唤起他残存的记忆', sub: '🎲 魅力检定 · DC 14', once: 'tried_memory',
        check: { stat: 'cha', dc: 14 },
        success: { text: '你谈起雾隐镇的风铃、他刻在塔门上的诗。莫尔甘的身躯猛地一颤，黑雾退去一线——"快……趁它还在沉睡！"（头目被削弱）', fx: { flag: 'morganWeakened' }, combat: 'boss_morgan', win: 'morgan_win' },
        fail: { text: '黑雾涌上他的面庞。"无用的怀念。"祭坛亮起猩红的光。', combat: 'boss_morgan', win: 'morgan_win' },
      },
      { text: '⚔️ 不再多言，直接开战', combat: 'boss_morgan', win: 'morgan_win' },
    ],
  },

  morgan_win: {
    text: '黑雾如退潮般散尽。\n\n莫尔甘跪倒在祭坛中央，恢复了清明的眼眸。他望着你掌心的碎片，像个迷路百年的孩子。\n\n"星核……拜托了。"',
    onEnter: (s) => s.flags.core === 'pure' ? 'ending_light' : 'ending_dark',
    choices: [],
  },

  /* ============ 支线 · 迷雾回廊（无尽模式） ============ */
  endless_intro: {
    onEnter: (s) => { if (typeof s.flags.endlessDepth !== 'number') s.flags.endlessDepth = 0; return null; },
    text: '你再度登上山巅。古塔背后的天空裂开一道细缝——缝隙里不是星空，而是一条悬在雾海之上的长廊。\n\n镇上的老人管它叫「迷雾回廊」：星坠之夜被击碎的东西并没有死透，它们的回响坠进了这里，一层一层，越陷越深。\n\n老人们还叮嘱过一句：有些雾墙的根部会裂着门洞，雾在门洞里打旋，却始终不肯钻进去。\n\n"别在门洞前逗留。"他们说，"门后面的东西，雾也不敢看。"\n\n回廊没有尽头。只要你还站着，它就会一直向下延伸。\n\n—— 此行没有结局，只有深度。',
    choices: [
      { text: '🌫️ 踏入回廊', go: 'endless_lobby' },
    ],
  },

  endless_lobby: {
    text: (s) => {
      const d = s.flags.endlessDepth || 0;
      let t = '回廊门厅——一座悬在雾海之上的环形石台。\n\n石台边缘，一重重雾墙自下而上排开，没入高处的黑暗。每破开一重，雾就更浓一分，墙后的低语就更清晰一分。\n\n';
      t += '—— 你已破开 ' + d + ' 重雾墙（最深纪录：第 ' + Endless.best() + ' 层）。\n';
      if (d > 0 && d % 5 === 0) t += '破开第五重雾墙的碎屑尚未落定，石缝里的星尘泉水又重新涌了出来。\n';
      if (endlessDoorFloor(s) && s.flags.endlessDoorFloor !== endlessDoorFloor(s)) {
        t += '下一重雾墙的根部，裂着一道仅容侧身的门洞——雾在门洞里打旋，却始终不肯钻进去。\n';
      }
      t += '\n石台中央，下一重雾墙正在凝聚。';
      return t;
    },
    choices: [
      {
        text: (s) => '⚔️ 迎战第 ' + ((s.flags.endlessDepth || 0) + 1) + ' 层的回响',
        subFn: (s) => ((s.flags.endlessDepth || 0) + 1) % 5 === 0 ? '回响头目镇守 · 胜后可择遗物回礼' : '遭遇战 · 雾更深一分',
        special: 'endless_fight',
      },
      {
        text: (s) => '🚪 推开雾中侧门（第 ' + endlessDoorFloor(s) + ' 层）',
        sub: '绕过这场战斗，直面异变 · 门后是福是祸，难说',
        special: 'endless_door',
        show: (s) => { const n = endlessDoorFloor(s); return !!n && s.flags.endlessDoorFloor !== n; },
      },
      {
        text: '⛲ 掬一口星尘泉水', sub: '恢复 60% 生命 · 每五层涌出一次',
        fx: { healPct: 60 }, go: 'endless_spring',
        show: (s) => (s.flags.endlessDepth || 0) > 0 && (s.flags.endlessDepth || 0) % 5 === 0 && s.flags.endlessSpringFloor !== (s.flags.endlessDepth || 0),
        disabled: (s) => s.player.hp >= s.player.maxHp,
        subFn: (s) => s.player.hp >= s.player.maxHp ? '生命已满，无需泉水' : null,
      },
      {
        text: '🛖 营地休整',
        subFn: (s) => s.player.hp >= s.player.maxHp
          ? '生命已满，无需休整'
          : '花费 ' + (20 + (s.flags.endlessDepth || 0) * 5) + ' 金币 · 恢复 40% 生命',
        special: 'endless_rest',
        disabled: (s) => s.player.hp >= s.player.maxHp,
      },
      { text: '🌀 离开回廊', sub: '纪录不会消失', special: 'to_title' },
    ],
  },

  endless_spring: {
    onEnter: (s) => { s.flags.endlessSpringFloor = s.flags.endlessDepth || 0; return null; },
    text: '门厅一侧的石缝里渗出一泓泉水，在幽暗中泛着温润的微光——和矿坑入口、旋梯中段的那些一样，是山腹里尚未被污染的活水。\n\n你掬起一口。凉意顺着喉咙落下，星屑似的暖意在四肢间散开。\n\n（泉水每五层涌出一次。下一次破开五重雾墙后，它会再度盈满。）',
    choices: [
      { text: '↩️ 抹去水渍，回到门厅', go: 'endless_lobby' },
    ],
  },

  endless_clear: {
    /* 文本先于 onEnter 求值：层数自增与回礼列表都在 onEnter 完成，
       动态信息（新层数 / 纪录 / 回礼）经返回的【…】消息追加在叙述之前 */
    onEnter: (s) => {
      s.flags.endlessDepth = (s.flags.endlessDepth || 0) + 1;
      const d = s.flags.endlessDepth;
      const msg = [];
      if (Endless.reach(d)) msg.push('【迷雾回廊 · 你已破开 ' + d + ' 重雾墙（最深纪录：第 ' + d + ' 层）】');
      s.flags.endlessPicks = null;
      /* 每五层（回响头目战）：三件未持有的星尘遗物浮现，任择其一 */
      if (d % 5 === 0) {
        const unowned = Object.keys(DATA.RELICS).filter((id) => !hasRelic(s, id));
        for (let i = unowned.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [unowned[i], unowned[j]] = [unowned[j], unowned[i]];
        }
        s.flags.endlessPicks = unowned.slice(0, 3);
        msg.push('【回响头目的回礼：三件星尘遗物的虚影自雾中浮现，任择其一】');
      }
      return msg.length ? msg.join('\n') : null;
    },
    text: '雾墙寸寸碎裂，回廊在你脚下又向下让出一程。\n\n雾中的低语换了一个调子——它在丈量你，而你也在丈量它。走得更深的人才能听清它们在说什么。',
    choices: [
      { text: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[0]]; return r ? r.icon + ' 收下' + r.name : ''; },
        subFn: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[0]]; return r ? r.desc : null; },
        special: 'endless_relic', pickIndex: 0,
        show: (s) => !!(s.flags.endlessPicks && DATA.RELICS[s.flags.endlessPicks[0]]) },
      { text: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[1]]; return r ? r.icon + ' 收下' + r.name : ''; },
        subFn: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[1]]; return r ? r.desc : null; },
        special: 'endless_relic', pickIndex: 1,
        show: (s) => !!(s.flags.endlessPicks && DATA.RELICS[s.flags.endlessPicks[1]]) },
      { text: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[2]]; return r ? r.icon + ' 收下' + r.name : ''; },
        subFn: (s) => { const r = DATA.RELICS[(s.flags.endlessPicks || [])[2]]; return r ? r.desc : null; },
        special: 'endless_relic', pickIndex: 2,
        show: (s) => !!(s.flags.endlessPicks && DATA.RELICS[s.flags.endlessPicks[2]]) },
      { text: '↩️ 不取回礼，返回门厅', go: 'endless_lobby' },
    ],
  },

  /* ============ 回廊异变（侧门后的六种遭遇） ============
     承诺制：每个选项都通向 endless_pass（结算收益/代价，破层下行）或一场战斗。 */

  /* —— 星辉石碑：三道凹槽，以一物换一物 —— */
  ev_stele: {
    text: '门后是一间半埋进雾里的石室。\n\n一块黑色的石碑斜插在室心，碑面上刻着三道凹槽，像三张阖着的嘴：一道沁着暗红，一道浮着星辉，一道嵌着铜绿。\n\n碑底有小字，笔画被岁月磨得很浅：「以一物，换一物。」',
    choices: [
      {
        text: '🩸 沁红的凹槽', sub: '失去 15% 生命上限 · 换一件未持有的星尘遗物',
        show: (s) => !!endlessRandomRelicId(s),
        fxFn: (s) => { const fx = { hpPct: -15 }; const r = endlessRandomRelicId(s); if (r) fx.relic = r; return fx; },
        special: 'endless_pass',
      },
      {
        text: '💫 浮着星辉的凹槽', subFn: (s) => '枕着回响入睡 · 获得大量经验（' + (25 + 6 * endlessEventDepth(s)) + '）',
        fxFn: (s) => ({ xp: 25 + 6 * endlessEventDepth(s) }),
        special: 'endless_pass',
      },
      {
        text: '🪙 嵌着铜绿的凹槽', subFn: (s) => '星尘凝成钱币 · 获得 ' + (20 + 6 * endlessEventDepth(s)) + ' 金币',
        fxFn: (s) => ({ gold: 20 + 6 * endlessEventDepth(s) }),
        special: 'endless_pass',
      },
    ],
  },

  /* —— 拾荒者的篝火：休整、赌局，或买一张来路不明的牌 —— */
  ev_campfire: {
    text: '门后竟有火光。\n\n一个披着油布斗篷的拾荒者守着一小堆篝火。火里烧的不是柴，是雾凝成的碎块，噼啪作响。「侧门后面居然还有人。」他头也不抬，「坐吧。或者赌一把——干我这行的，赌运气比赌命长。」',
    choices: [
      {
        text: '🛖 借火烤干斗篷',
        subFn: (s) => s.player.hp >= s.player.maxHp ? '生命已满，无需烤火' : '恢复 30% 生命',
        fx: { healPct: 30 },
        special: 'endless_pass',
        disabled: (s) => s.player.hp >= s.player.maxHp,
      },
      {
        text: '🎲 掷一把星尘骰',
        subFn: (s) => '智力检定 DC ' + (9 + Math.floor(endlessEventDepth(s) / 2)) + ' · 赢了拿走他的星尘袋',
        check: { stat: 'int', dc: (s) => 9 + Math.floor(endlessEventDepth(s) / 2) },
        success: { text: '骰子停在你说出的点数上。\n\n拾荒者骂了一声，把一小袋星尘推了过来——落进你掌心就化成了温热的金币。', fxFn: (s) => ({ gold: 30 + 8 * endlessEventDepth(s) }), pass: true },
        fail: { text: '骰子停在反面。\n\n拾荒者笑着把你的赌注扒拉进怀里：「下回带够运气再来。」', fxFn: (s) => ({ gold: -(15 + 4 * endlessEventDepth(s)) }), pass: true },
      },
      {
        text: '🂠 翻看他的货担',
        subFn: (s) => '花费 ' + (25 + 5 * endlessEventDepth(s)) + ' 金币 · 换一张来路不明的牌',
        requireGold: (s) => 25 + 5 * endlessEventDepth(s),
        fxFn: (s) => ({ gold: -(25 + 5 * endlessEventDepth(s)), card: endlessRandomCardId() }),
        special: 'endless_pass',
      },
    ],
  },

  /* —— 雾中行商：挂灯笼的窄廊，只收带雾气的金币 —— */
  ev_merchant: {
    onEnter: (s) => {
      const d = endlessEventDepth(s);
      /* 货担属于当前层：在同层反复进出不换货，破层后再来才是新货 */
      if (s.flags.endlessStockFloor !== d || !Array.isArray(s.flags.endlessStock)) {
        s.flags.endlessStockFloor = d;
        s.flags.endlessStock = endlessMerchantStock(d);
      }
      return null;
    },
    text: '门后是一条挂满纸灯笼的窄廊。\n\n一个看不清脸的行商坐在货担后面，斗笠压得很低，帽檐下只有雾。「回廊里的东西，外头的钱买不走。」他的声音像隔着一层水，「我只要带雾气的金币。」',
    choices: endlessMerchantChoices().concat([
      { text: '🚪 道别，继续下行', sub: '雾墙会在你身后合拢', special: 'endless_pass' },
    ]),
  },

  /* —— 雾影窃贼：先偷后算，追或不追 —— */
  ev_thief: {
    onEnter: (s) => {
      const take = Math.min(s.player.gold, 10 + 3 * endlessEventDepth(s));
      if (take > 0) {
        s.player.gold -= take;
        return '【雾影窃贼掠走了 ' + take + ' 金币】';
      }
      return '【它在你空空的钱袋边绕了一圈，似乎很失望。】';
    },
    text: '门后是一条仅容侧身的裂缝。\n\n你挤进去时，一小片影子贴着地面窜过——有什么东西在你钱袋里轻轻一撞，随即钻进了雾的深处。\n\n裂缝尽头，雾在打转，岔出一条条看不清去路的小径。',
    choices: [
      {
        text: '🏃 追进雾里',
        subFn: (s) => '敏捷检定 DC ' + (10 + Math.floor(endlessEventDepth(s) / 3)) + ' · 夺回金币，或许还有利息',
        check: { stat: 'agi', dc: (s) => 10 + Math.floor(endlessEventDepth(s) / 3) },
        success: { text: '你在第三个岔口堵住了它。\n\n小东西把金币丢还给你，还多添了几枚——像是利息，又像是求饶。', fxFn: (s) => ({ gold: 25 + 7 * endlessEventDepth(s) }), pass: true },
        fail: { text: '岔路一条接一条，影子早没了踪影。\n\n你摸黑往回走，在嶙峋的石壁上擦破了手肘。', fxFn: (s) => ({ gold: -(12 + 4 * endlessEventDepth(s)), hpPct: -5 }), pass: true },
      },
      {
        text: '🗣️ 冲雾喊话',
        subFn: (s) => '魅力检定 DC ' + (11 + Math.floor(endlessEventDepth(s) / 3)) + ' · 让它把东西还回来',
        check: { stat: 'cha', dc: (s) => 11 + Math.floor(endlessEventDepth(s) / 3) },
        success: { text: '你的嗓门在裂缝里荡出回声。\n\n影子停了一瞬，把鼓鼓的钱袋丢了出来，一瘸一拐地遁入雾底。', fxFn: (s) => ({ gold: 12 + 4 * endlessEventDepth(s) }), pass: true },
        fail: { text: '雾把你的声音吞得干干净净。\n\n等回声散尽，你数了数——袋里的金币比刚才更少了。', fxFn: (s) => ({ gold: -(15 + 5 * endlessEventDepth(s)) }), pass: true },
      },
      {
        text: '✋ 就当喂了雾',
        subFn: (s) => '记下它跑动的路线 · 获得 ' + (8 + 2 * endlessEventDepth(s)) + ' 经验',
        fxFn: (s) => ({ xp: 8 + 2 * endlessEventDepth(s) }),
        special: 'endless_pass',
      },
    ],
  },

  /* —— 星尘裂隙：一道漏着星辉的缝，甜味可疑 —— */
  ev_crack: {
    text: '门后没有房间——只有一道把石壁撑开的裂隙。\n\n星辉从缝隙深处漏出来，在地面淌成一小片银色的洼。风从裂隙里吹出来，带着一点很淡的、类似星屑的甜味。\n\n你的手比脑子先动了。',
    choices: [
      {
        text: '🤲 掬一捧银色的洼', sub: '多半是甘泉 · 也可能烫手',
        fxFn: () => (Math.random() < 0.65 ? { healPct: 35 } : { hpPct: -12 }),
        special: 'endless_pass',
      },
      {
        text: '🧪 装一瓶裂隙里的光', sub: '得到星辉露珠 · 恢复 40 点生命',
        fxFn: () => ({ item: 'star_dew' }),
        special: 'endless_pass',
      },
      {
        text: '📐 丈量裂隙的走向', subFn: (s) => '记下星辉的流向 · 获得 ' + (18 + 5 * endlessEventDepth(s)) + ' 经验',
        fxFn: (s) => ({ xp: 18 + 5 * endlessEventDepth(s) }),
        special: 'endless_pass',
      },
    ],
  },

  /* —— 坍塌的暗室：前人的行囊，新鲜的爪印 —— */
  ev_ambush: {
    text: '门后是一间被雾压塌了半边的暗室。\n\n碎石之间散落着前人的行囊——翻得干干净净，只留下几枚滚进石缝的星尘币，和一圈新鲜的爪印。\n\n头顶，你挤进来时撑开的那道缝，正在慢慢收口。',
    choices: [
      {
        text: '⚔️ 背靠石壁，提械备战', sub: '爪印的主人还在暗处 · 胜利照常破层',
        combat: 'wall_spawns', win: 'endless_clear',
      },
      {
        text: '💰 抓起行囊就往外挤',
        subFn: (s) => '夺得 ' + (30 + 8 * endlessEventDepth(s)) + ' 金币 · 挤出裂缝时擦伤（失去 8% 生命上限）',
        fxFn: (s) => ({ gold: 30 + 8 * endlessEventDepth(s), hpPct: -8 }),
        special: 'endless_pass',
      },
    ],
  },

  /* ============ 结局 ============ */
  ending_light: {
    text: (s) => '净化后的星核归位，光柱自塔顶直贯天穹。\n\n缠绵百年的雾，在晨光中一寸寸消散。风铃声响彻雾隐镇的每一条街巷——那是人们第一次听清风铃真正的声音。\n\n' + (s.flags.minerSaved ? '托马斯带着矿工们重建了矿坑，你的名字被刻在新的矿监日志第一页。\n\n' : '') + (s.flags.wispDeal ? '你按了按太阳穴——那缕盘旋不去的低语，终于在光里安静了下来，像一声叹息。\n\n' : '') + '守塔人莫尔甘的墓碑立在塔下，碑文是他自己刻的最后一行诗：\n"雾散之处，皆是归途。"\n\n—— 完 ——【结局 · 星光】\n\n✦ 第 ' + Cycle.count() + ' 段旅程已记入星图' + (Cycle.count() > 1 ? '。' : '——标题画面已解锁「继承开局」。'),
    choices: [
      { text: '✨ 回到标题', special: 'to_title' },
    ],
  },

  ending_dark: {
    text: (s) => '你握碎碎片，任由黑暗贯通全身。\n\n剧痛之后，是前所未有的清明。你抬起手，雾便向两侧退开；你低语一声，星轨重新亮起。\n\n雾散了——以另一种方式。\n\n' + (s.flags.minerSaved ? '托马斯远远望着塔顶的你，摘帽，深深一躬。\n\n' : '') + (s.flags.wispDeal ? '林心的那缕低语匍匐在星光之下——它认出了你，像一个认出旧主的老仆。\n\n' : '') + '后来，雾隐镇的人们敬畏地称你为——新守塔人。\n星核的低语只对一人言说，而那人说：很好。\n\n—— 完 ——【结局 · 新王】\n\n✦ 第 ' + Cycle.count() + ' 段旅程已记入星图' + (Cycle.count() > 1 ? '。' : '——标题画面已解锁「继承开局」。'),
    choices: [
      { text: '✨ 回到标题', special: 'to_title' },
    ],
  },

  ending_peace: {
    text: (s) => '镇长将碎片锁入圣龛，铁链缠了七道。\n\n雾依旧，但镇子活了下来。矿工们下井时会在巷口放一盏灯——给墙里的心跳听。\n\n偶尔，你会在梦里听见那搏动。不急。它说。\n\n' + (s.flags.wispDeal ? '而另一缕低语——林心的那一位——则在你血中轻轻笑了：和你的买卖，不会作数太久。\n\n' : '') + '—— 完 ——【结局 · 长夜】\n\n✦ 第 ' + Cycle.count() + ' 段旅程已记入星图' + (Cycle.count() > 1 ? '。' : '——标题画面已解锁「继承开局」。'),
    choices: [
      { text: '✨ 回到标题', special: 'to_title' },
    ],
  },
};

/* ============================ 任务与笔记 ============================ */
DATA.QUESTS = {
  main_mine:  { id: 'main_mine', kind: '主线', name: '调查迷雾矿坑', desc: '镇长悬赏：星坠石砸穿矿坑三层，七名矿工失踪。查明异动的源头，救回能救的人。' },
  main_tower: { id: 'main_tower', kind: '主线', name: '星核与古塔', desc: '星核碎片在掌中低语，古塔在北方山巅注视。带上它登上塔顶，面对守塔人莫尔甘。' },
  side_miner: { id: 'side_miner', kind: '支线', name: '巷道深处的呼救', desc: '矿坑一层传来微弱的呼救声，夹杂着窸窣的爬行声——有人还活着。' },
  side_grove: { id: 'side_grove', kind: '支线', name: '林心的异光', desc: '药婆雾葵的泉眼被一团"会说话的雾"占了。低语许诺你力量——但低语从来不安好心。让泉水重新清澈起来。' },
  side_wall:  { id: 'side_wall', kind: '支线', name: '墙中的心跳', desc: '矿坑第七巷的墙在搏动。酒馆的传闻、半张地图、矿监日志、托马斯的警告——全都指向这里。墙里的东西，已经等了很久。' },
};

DATA.NOTES = {
  night_star:    { id: 'night_star', title: '✦ 星坠之夜', text: '星坠石划破天穹，坠入矿坑三层。自那夜起，雾不再散，走兽狂暴，墙里有心跳。' },
  tavern_rumor:  { id: 'tavern_rumor', title: '🍺 矿坑第七巷的传闻', text: '醉酒的矿工吐了真言："第七巷……墙里有心跳声……"' },
  tavern_lore:   { id: 'tavern_lore', title: '📖 守塔人的歌谣', text: '百年前，守塔人莫尔甘以星核为锁、以性命为钥，封印影魔于塔顶。此后雾锁小镇，再无人登塔——直到那颗星，砸穿了锁。' },
  elder_secret:  { id: 'elder_secret', title: '🏛️ 封印与星核', text: '镇长透露：塔顶封印着影魔，而星核是锁。那颗坠落的星，砸开的不只是矿坑。' },
  miner_warning: { id: 'miner_warning', title: '⛑️ 托马斯的警告', text: '获救的矿工托马斯说："第七巷的墙里有东西在跳。别信它说的话。"' },
  mine_map:      { id: 'mine_map', title: '🗺️ 半张矿坑地图', text: '从劫掠者的赃物中得来。地图上，第七巷被红炭笔圈了三圈。' },
  mine_log:      { id: 'mine_log', title: '📜 矿监日志', text: '"第七巷的墙不是墙。它在呼吸。我们凿穿了三层，矿工说下面有光——不该有光的。……如果你看到这本日志，带上电光瓶，然后跑。"' },
  core_whisper:  { id: 'core_whisper', title: '💠 星核的低语', text: '碎片有三种诉求：被净化，被吞噬，或被永远封存。而无论哪种，古塔都在注视着你。' },
  morgan_words:  { id: 'morgan_words', title: '😈 守塔人的话', text: '"把它交给我。或者，成为塔的一部分。"——堕落守塔人·莫尔甘，于塔顶祭坛。' },
  grove_lore:    { id: 'grove_lore', title: '🌿 药婆的话', text: '药婆雾葵说：星坠那夜，有星屑落进林心泉眼。"泉水喂了百年的山，如今山病了，泉也病了。会说话的雾不是泉生的——是乘着星屑的光，从更深的地方渗进来的。"' },
  wisp_pact:     { id: 'wisp_pact', title: '🩸 雾的契约', text: '"替我摘下泉底的微光，我便教你让血肉燃起星火的秘法。反正，这镇子的雾，又不是我造的。"——你收下了它的馈赠。低语仍在脑中盘旋。' },
  spring_pure:   { id: 'spring_pure', title: '💠 重澈的泉眼', text: '低语散尽，泉底的星屑浮上水面，碎成满潭清光。雾葵说，泉水喂了百年的山峦——泉清了，山或许还有救。' },
  tower_fresco:  { id: 'tower_fresco', title: '🎨 塔底壁画', text: '壁画描绘百年前的那一夜：守塔人将影魔钉入塔顶，星核化作锁链。最末一格，他独自坐在祭坛边，在塔门上刻下一行诗。' },
  keeper_journal:{ id: 'keeper_journal', title: '📜 守塔人的手记', text: '"雾又开始涨了。我把诗刻在门上——若有人念起它，或许能想起我不是怪物。……第两百一十四年。星核还在唱。我把耳朵贴着锁，听了整夜。"' },
  wall_whisper:  { id: 'wall_whisper', title: '👂 墙中的低语', text: '贴着第七巷的墙，低语一遍遍念着六个名字。数到第七个时——它停了一下，像是在等你补上。' },
  sixth_fate:    { id: 'sixth_fate', title: '📜 第六人的去向', text: '第七巷深处的裂缝旁，第六人的行囊叠得整整齐齐。前五个人被墙吃了；第六人放下了剑，自己走了进去。托马斯说"别信它说的话"——可有人信了。' },
  chime_lore:    { id: 'chime_lore', title: '🎐 风铃的来历', text: '聋伯说：雾隐镇建镇那年，初代守塔人亲手调了满镇的风铃——"铃声不断，雾就不进镇。"铃，是锁的一部分。可如今，铃一只接一只地哑了。' },
};

/* 高阶卡牌（旅人出售，按职业） */
DATA.CLASS_CARDS = { warrior: 'battle_rage', mage: 'flamestorm', ranger: 'piercing_arrow' };

/* ============================ 成就 ============================
   跨周目持久保存；test(state) 返回 true 即解锁。
   结局成就依赖 scene（结局场景自身），支线成就依赖 flags。
============================================================ */
DATA.ACHIEVEMENTS = {
  first_win:     { id: 'first_win', icon: '⚔️', name: '初战告捷', desc: '首次战斗胜利。', test: (s) => s.stats.battles >= 1 },
  worm_slain:    { id: 'worm_slain', icon: '🪱', name: '矿坑之王', desc: '击败矿坑之王·掘地虫。', test: (s) => s.flags.bossDown },
  wall_slain:    { id: 'wall_slain', icon: '🫀', name: '墙中的心跳', desc: '击败第七巷的墙中之物。', test: (s) => s.flags.wallDone },
  wisp_pure:     { id: 'wisp_pure', icon: '💠', name: '重澈的泉眼', desc: '净化林心泉眼，完成「林心的异光」。', test: (s) => s.flags.springDone },
  miner_saved:   { id: 'miner_saved', icon: '⛑️', name: '生命的重量', desc: '救出被困矿工托马斯。', test: (s) => s.flags.minerSaved },
  blade_claimed: { id: 'blade_claimed', icon: '🗡️', name: '百年之约', desc: '从星轨石像手中取得星辉长剑。', test: (s) => s.flags.golemLoot },
  pact_made:     { id: 'pact_made', icon: '🩸', name: '低语的契约', desc: '接受林心低语的馈赠。', test: (s) => s.flags.wispDeal },
  chime_heard:   { id: 'chime_heard', icon: '🎐', name: '铃语的听众', desc: '听聋伯讲完风铃的来历。', test: (s) => s.journal.notes.some((n) => n.id === 'chime_lore') },
  veteran:       { id: 'veteran', icon: '🛡️', name: '身经百战', desc: '累计战斗 15 场。', test: (s) => s.stats.battles >= 15 },
  collector:     { id: 'collector', icon: '🂠', name: '牌组收藏家', desc: '牌组达到 20 张。', test: (s) => s.deck.length >= 20 },
  relic_hunter:  { id: 'relic_hunter', icon: '⚱️', name: '星尘收藏家', desc: '同时持有 4 件星尘遗物。', test: (s) => Array.isArray(s.relics) && s.relics.length >= 4 },
  rich:          { id: 'rich', icon: '💰', name: '小有身家', desc: '同时持有 500 金币。', test: (s) => s.player.gold >= 500 },
  ascendant:     { id: 'ascendant', icon: '⭐', name: '登峰造极', desc: '达到 Lv.8。', test: (s) => s.player.level >= 8 },
  scholar:       { id: 'scholar', icon: '📓', name: '博闻强识', desc: '冒险笔记收集 12 篇。', test: (s) => s.journal.notes.length >= 12 },
  ending_light:  { id: 'ending_light', icon: '✨', name: '结局 · 星光', desc: '净化星核，雾散于晨光。', test: (s) => s.flags.core === 'pure' && String(s.scene).indexOf('ending') === 0 },
  ending_dark:   { id: 'ending_dark', icon: '👑', name: '结局 · 新王', desc: '吞下黑暗，成为新守塔人。', test: (s) => s.flags.core === 'absorb' && String(s.scene).indexOf('ending') === 0 },
  ending_peace:  { id: 'ending_peace', icon: '🕊️', name: '结局 · 长夜', desc: '封存碎片，雾依旧，镇犹存。', test: (s) => s.scene === 'ending_peace' },
  codex_cards:   { id: 'codex_cards', icon: '📖', name: '阅牌无数', desc: '冒险图鉴累计收录 20 种卡牌。', test: () => Codex.count('cards') >= 20 },
  codex_relics:  { id: 'codex_relics', icon: '⚱️', name: '星尘全图', desc: '冒险图鉴收录全部 13 件星尘遗物。', test: () => Codex.count('relics') >= Object.keys(DATA.RELICS).length },
  codex_enemies: { id: 'codex_enemies', icon: '👹', name: '雾中百景', desc: '冒险图鉴累计收录 10 种敌人。', test: () => Codex.count('enemies') >= 10 },
  cycle_2:       { id: 'cycle_2', icon: '🔄', name: '轮回之始', desc: '完成第 2 周目。', test: () => Cycle.count() >= 2 },
  cycle_3:       { id: 'cycle_3', icon: '♾️', name: '雾中轮回', desc: '完成第 3 周目。', test: () => Cycle.count() >= 3 },
  diff_hard:     { id: 'diff_hard', icon: '🌫️', name: '试炼成王', desc: '以迷雾试炼（困难）难度通关任一结局。', test: (s) => s.diff === 1 && String(s.scene).indexOf('ending') === 0 },
  forget_3:      { id: 'forget_3', icon: '🌀', name: '忘却的铃声', desc: '在铃语斋以忘却之铃移除 3 张卡牌。', test: (s) => (s.stats.forgotten || 0) >= 3 },
  endless_5:     { id: 'endless_5', icon: '🌫️', name: '初入回廊', desc: '在迷雾回廊破开 5 重雾墙。', test: () => Endless.best() >= 5 },
  endless_10:    { id: 'endless_10', icon: '🌀', name: '回廊行者', desc: '在迷雾回廊破开 10 重雾墙。', test: () => Endless.best() >= 10 },
  endless_15:    { id: 'endless_15', icon: '♾️', name: '雾渊之主', desc: '在迷雾回廊破开 15 重雾墙。', test: () => Endless.best() >= 15 },
  door_10:       { id: 'door_10', icon: '🚪', name: '叩门者', desc: '在迷雾回廊穿过 10 扇雾中侧门。', test: () => Endless.doors() >= 10 },
  ev_all:        { id: 'ev_all', icon: '👁️', name: '异变全识', desc: '在迷雾回廊遭遇过全部 6 种异变。', test: () => Endless.events().length >= DATA.ENDLESS_EVENTS.length },
};
