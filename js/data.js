'use strict';
/* ============================================================
   星坠之谜 — 游戏数据
   卡牌 / 敌人 / 物品 / 装备 / 商店 / 剧情场景
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

  /* —— 法师 —— */
  ice_shard:       { id: 'ice_shard', name: '冰锥', cost: 1, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 5, statusEnemy: { weak: 1 } }, desc: '造成 5 点伤害，给予 1 层虚弱。' },
  fireball:        { id: 'fireball', name: '火球术', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 15 }, desc: '造成 15 点伤害。' },
  chain_lightning: { id: 'chain_lightning', name: '闪电链', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'all', fx: { dmgAll: 8 }, desc: '对所有敌人造成 8 点伤害。' },
  drain_life:      { id: 'drain_life', name: '吸取生命', cost: 2, type: 'attack', cls: 'mage', rarity: 'common', target: 'enemy', fx: { dmg: 8, heal: 5 }, desc: '造成 8 点伤害，恢复 5 点生命。' },
  meditate:        { id: 'meditate', name: '冥想', cost: 1, type: 'skill', cls: 'mage', rarity: 'common', target: 'self', fx: { draw: 2 }, desc: '抽 2 张牌。' },
  flamestorm:      { id: 'flamestorm', name: '烈焰风暴', cost: 3, type: 'attack', cls: 'mage', rarity: 'rare', target: 'all', fx: { dmgAll: 14 }, desc: '对所有敌人造成 14 点伤害。' },
  mana_surge:      { id: 'mana_surge', name: '法力涌动', cost: 0, type: 'power', cls: 'mage', rarity: 'rare', target: 'self', fx: { energy: 2 }, desc: '本回合获得 2 点行动力。' },
  curse_bind:      { id: 'curse_bind', name: '咒缚', cost: 1, type: 'attack', cls: 'mage', rarity: 'rare', target: 'enemy', fx: { dmg: 3, statusEnemy: { weak: 2 } }, desc: '造成 3 点伤害，给予 2 层虚弱。' },

  /* —— 游侠 —— */
  double_shot:     { id: 'double_shot', name: '双重射击', cost: 1, type: 'attack', cls: 'ranger', rarity: 'starter', target: 'enemy', fx: { dmg: 4, times: 2 }, desc: '造成 4 点伤害，共 2 次。' },
  poison_arrow:    { id: 'poison_arrow', name: '淬毒箭', cost: 1, type: 'attack', cls: 'ranger', rarity: 'common', target: 'enemy', fx: { dmg: 3, statusEnemy: { poison: 3 } }, desc: '造成 3 点伤害，给予 3 层中毒。' },
  volley:          { id: 'volley', name: '箭雨', cost: 2, type: 'attack', cls: 'ranger', rarity: 'common', target: 'all', fx: { dmgAll: 6, draw: 1 }, desc: '对所有敌人造成 6 点伤害，抽 1 张牌。' },
  dead_mark:       { id: 'dead_mark', name: '致命标记', cost: 0, type: 'skill', cls: 'ranger', rarity: 'starter', target: 'enemy', fx: { statusEnemy: { vuln: 2 } }, desc: '给予目标 2 层易伤。' },
  swift_retreat:   { id: 'swift_retreat', name: '灵巧后跃', cost: 1, type: 'skill', cls: 'ranger', rarity: 'common', target: 'self', fx: { block: 4, statusAllEnemy: { weak: 1 } }, desc: '获得 4 点护甲，所有敌人获得 1 层虚弱。' },
  piercing_arrow:  { id: 'piercing_arrow', name: '贯穿箭', cost: 2, type: 'attack', cls: 'ranger', rarity: 'rare', target: 'enemy', fx: { dmg: 12 }, desc: '造成 12 点伤害。' },
  hunters_instinct:{ id: 'hunters_instinct', name: '猎人直觉', cost: 1, type: 'power', cls: 'ranger', rarity: 'rare', target: 'self', fx: { statusSelf: { strength: 1 }, draw: 1 }, desc: '获得 1 层力量，抽 1 张牌。' },

  /* —— 中立 —— */
  first_aid:      { id: 'first_aid', name: '急救', cost: 1, type: 'skill', cls: null, rarity: 'common', target: 'self', fx: { heal: 9 }, desc: '恢复 9 点生命。' },
  energy_crystal: { id: 'energy_crystal', name: '能量水晶', cost: 0, type: 'skill', cls: null, rarity: 'rare', target: 'self', fx: { energy: 2 }, desc: '本回合获得 2 点行动力。' },
  shadow_strike:  { id: 'shadow_strike', name: '影袭', cost: 1, type: 'attack', cls: null, rarity: 'common', target: 'enemy', fx: { dmg: 8 }, desc: '造成 8 点伤害。' },
  purify:         { id: 'purify', name: '净化之光', cost: 1, type: 'skill', cls: null, rarity: 'rare', target: 'self', fx: { cleanse: true, heal: 5 }, desc: '清除自身所有负面状态，恢复 5 点生命。' },
  shadow_rage:    { id: 'shadow_rage', name: '影之怒', cost: 3, type: 'attack', cls: null, rarity: 'boss', target: 'all', fx: { dmgAll: 12, statusAllEnemy: { weak: 1 } }, desc: '对所有敌人造成 12 点伤害，给予 1 层虚弱。' },
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
};

/* ============================ 物品 ============================ */
DATA.ITEMS = {
  potion:        { id: 'potion', name: '治疗药水', art: '🧪', desc: '恢复 25 点生命。', use: { heal: 25 }, price: 30 },
  big_potion:    { id: 'big_potion', name: '大治疗药水', art: '🍶', desc: '恢复 60 点生命。', use: { heal: 60 }, price: 65 },
  firebomb:      { id: 'firebomb', name: '火焰瓶', art: '🔥', desc: '对一名敌人造成 16 点伤害。（战斗）', use: { dmg: 16 }, combatOnly: true, price: 35 },
  energy_potion: { id: 'energy_potion', name: '能量药水', art: '⚡', desc: '获得 2 点行动力。（战斗）', use: { energy: 2 }, combatOnly: true, price: 50 },
  antidote:      { id: 'antidote', name: '解毒草', art: '🌿', desc: '清除自身负面状态。（战斗）', use: { cleanse: true }, combatOnly: true, price: 25 },
  star_shard:    { id: 'star_shard', name: '星核碎片', art: '💠', desc: '任务物品。温热，像一颗小小的心脏。', quest: true },
  miner_note:    { id: 'miner_note', name: '矿工的遗嘱', art: '📜', desc: '记着矿坑深处的传闻。', quest: true },
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
  boss_worm:      ['worm'],
  boss_morgan:    ['morgan', 'shadow_mage'],
};

/* 随机遭遇池 */
DATA.ENCOUNTERS = {
  wild: ['goblins2', 'wolf_goblin', 'shaman_wolf', 'bats'],
  mine: ['skeletons', 'spiders', 'bats', 'skeleton_spider', 'statue', 'lurker'],
};

/* ============================ 剧情场景 ============================
   scene: {
     text: string | (state)=>string,
     onEnter: (state)=>string|场景id   // 返回字符串则追加显示，返回场景id则立即跳转
     choices: [ choice ]  choice: {
       text, icon?, sub?,
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
      { text: '🏛️ 镇长府', sub: '拜见镇长艾德温', go: 'elder' },
      {
        text: '🛏️ 客栈歇脚', sub: '花费 10 金币，恢复全部生命',
        fx: { gold: -10, healPct: 100 }, requireGold: 10,
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
    text: '炉火映红半面墙。铁匠布洛克头也不抬：\n\n"外乡人？星坠之后来的人，你是第七个。前六个……嗯，自己看货吧。"',
    onEnter: (s) => { s.flags.inSmith = true; },
    choices: [
      { text: '🧪 治疗药水 —— 30 金币', sub: '恢复 25 点生命', fx: { gold: -30, item: 'potion' }, requireGold: 30, go: 'smith' },
      { text: '🗡️ 精铁长剑 —— 60 金币', sub: '武器 · 攻击伤害 +2（替换锈蚀短剑）', fx: { gold: -60, gear: 'iron_sword' }, requireGold: 60, show: (s) => s.player.gear.weapon !== 'iron_sword', go: 'smith' },
      { text: '🥋 硬皮甲 —— 55 金币', sub: '护甲 · 护甲值 +2（替换粗布衣）', fx: { gold: -55, gear: 'leather_armor' }, requireGold: 55, show: (s) => s.player.gear.armor !== 'leather_armor', go: 'smith' },
      { text: '📿 力量护符 —— 65 金币', sub: '饰品 · 力量 +1', fx: { gold: -65, gear: 'amulet_pow' }, requireGold: 65, once: 'bought_pow', go: 'smith' },
      { text: '🧤 迅捷护腕 —— 65 金币', sub: '饰品 · 敏捷 +1', fx: { gold: -65, gear: 'amulet_agi' }, requireGold: 65, once: 'bought_agi', go: 'smith' },
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
        success: null,
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
        msg.push('【获得 45 金币 / 火焰瓶 ×1 / 饰品·狼王獠牙（力量+1）】');
      }
      return msg.length ? msg.join('\n') : null;
    },
    text: '狼群守护的树洞里藏着它们的"家当"：一袋铜币、一瓶火油，还有一枚泛着寒光的巨大獠牙。\n\n雾在树洞后散开——山道尽头，矿坑漆黑的入口已经遥遥在望。',
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
        Note.add(s, 'mine_log');
        return '【获得 80 金币 / 能量药水 ×1】';
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
        Quest.done(s, 'main_mine');
        Quest.add(s, 'main_tower');
        return '【获得 任务物品·星核碎片 / 大量经验】';
      }
      return null;
    },
    text: '巨虫轰然倒地，激起漫天尘雾。\n\n星核碎片落入你的掌心。它温热，像一颗小小的心脏，与远处古塔的方向遥遥呼应。\n\n轰隆——矿坑开始坍塌。你夺路狂奔，身后巷道接连崩落。',
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
        fail: { text: '黑雾顺着指尖倒灌而入！你甩手斩断联结，碎片跌在草叶间，微微发烫。（生命 -12）', fx: { hp: -12, flag2: { core: 'pure' }, card: 'purify' }, go: 'tower_gate' },
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
      { text: '⚡ 能量药水 —— 50 金币', sub: '战斗中 +2 行动力', fx: { gold: -50, item: 'energy_potion' }, requireGold: 50, once: 'shop_ep', go: 'tower_gate' },
      { text: '🌿 解毒草 —— 25 金币', sub: '战斗中清除负面状态', fx: { gold: -25, item: 'antidote' }, requireGold: 25, once: 'shop_ad', go: 'tower_gate' },
      { text: '🥋 锁子甲 —— 120 金币', sub: '护甲 · 护甲值 +3', fx: { gold: -120, gear: 'chain_mail' }, requireGold: 120, show: (s) => s.player.gear.armor !== 'chain_mail', go: 'tower_gate' },
      { text: '🂠 高阶卡牌 —— 100 金币', subFn: () => '职业限定 · 加入牌组', fx: { gold: -100, special: 'class_card' }, requireGold: 100, once: 'shop_card', go: 'tower_gate' },
      {
        text: '🔥 在旅人的篝火旁休整', sub: '恢复 50% 生命', once: 'tower_rest',
        fx: { healPct: 50 }, go: 'tower_gate',
      },
      { text: '🚪 踏入古塔', sub: '进入后将无法回头', go: 'tower_top' },
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

  /* ============ 结局 ============ */
  ending_light: {
    text: (s) => '净化后的星核归位，光柱自塔顶直贯天穹。\n\n缠绵百年的雾，在晨光中一寸寸消散。风铃声响彻雾隐镇的每一条街巷——那是人们第一次听清风铃真正的声音。\n\n' + (s.flags.minerSaved ? '托马斯带着矿工们重建了矿坑，你的名字被刻在新的矿监日志第一页。\n\n' : '') + '守塔人莫尔甘的墓碑立在塔下，碑文是他自己刻的最后一行诗：\n"雾散之处，皆是归途。"\n\n—— 完 ——【结局 · 星光】',
    choices: [
      { text: '✨ 回到标题', special: 'to_title' },
    ],
  },

  ending_dark: {
    text: (s) => '你握碎碎片，任由黑暗贯通全身。\n\n剧痛之后，是前所未有的清明。你抬起手，雾便向两侧退开；你低语一声，星轨重新亮起。\n\n雾散了——以另一种方式。\n\n' + (s.flags.minerSaved ? '托马斯远远望着塔顶的你，摘帽，深深一躬。\n\n' : '') + '后来，雾隐镇的人们敬畏地称你为——新守塔人。\n星核的低语只对一人言说，而那人说：很好。\n\n—— 完 ——【结局 · 新王】',
    choices: [
      { text: '✨ 回到标题', special: 'to_title' },
    ],
  },

  ending_peace: {
    text: '镇长将碎片锁入圣龛，铁链缠了七道。\n\n雾依旧，但镇子活了下来。矿工们下井时会在巷口放一盏灯——给墙里的心跳听。\n\n偶尔，你会在梦里听见那搏动。不急。它说。\n\n—— 完 ——【结局 · 长夜】',
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
};

/* 高阶卡牌（旅人出售，按职业） */
DATA.CLASS_CARDS = { warrior: 'battle_rage', mage: 'flamestorm', ranger: 'piercing_arrow' };
