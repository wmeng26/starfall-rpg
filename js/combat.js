'use strict';
/* ============================================================
   星坠之谜 — 卡牌战斗引擎（类杀戮尖塔）
   状态: 中毒(每回合扣血递减) / 虚弱(输出×0.75) / 易伤(受伤×1.5) / 力量(攻击+N)
   ============================================================ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const STATUS_INFO = {
  poison: { name: '中毒', icon: '☠️' },
  weak:   { name: '虚弱', icon: '🔻' },
  vuln:   { name: '易伤', icon: '💥' },
  strength: { name: '力量', icon: '💪' },
};

const Combat = {

  C: null, /* 当前战斗状态 */

  /* 中途放弃战斗（回标题等）：置 over 以终止进行中的异步回合流程 */
  abandon() {
    if (this.C) { this.C.over = true; this.C = null; }
  },

  /* ============ 开战 ============ */
  start(groupKey, winScene) {
    let key = groupKey;
    if (key.indexOf('random:') === 0) {
      const pool = DATA.ENCOUNTERS[key.slice(7)];
      key = pool[Math.floor(Math.random() * pool.length)];
    }
    const ids = DATA.GROUPS[key];
    if (!ids) { console.error('未知敌群: ' + key); return; }

    const enemies = ids.map((id, i) => {
      const base = DATA.ENEMIES[id];
      return {
        uid: 'e' + i, base: id, name: base.name, art: base.art,
        hp: base.hp, maxHp: base.hp, block: 0, statuses: {},
        lastMove: null, intent: null, boss: !!base.boss,
      };
    });

    this.C = {
      enemies,
      player: { block: 0, statuses: {} },
      hand: [], draw: shuffle(G.state.deck.slice()), discard: [],
      energy: 3, maxEnergy: 3, turn: 0,
      busy: true, over: false,
      selected: -1, targetingItem: null,
      winScene: winScene || 'town',
      rewards: null,
    };

    G.state.stats.battles += 1;
    UI.log('⚔️ 遭遇：' + enemies.map((e) => e.name).join('、'), 'battle');
    UI.showView('combat');
    UI.renderChar(); /* 重绘面板：战斗中隐藏面板物品"使用"按钮 */
    UI.renderHud();

    /* 唤起记忆：头目被削弱 */
    if (G.state.flags.morganWeakened) {
      for (const e of enemies) {
        if (e.base === 'morgan') {
          e.hp = Math.max(1, e.hp - 25);
          e.maxHp = e.hp + 25;
          e.statuses.vuln = 2;
        }
      }
    }

    this.startPlayerTurn(true);
  },

  /* ============ 回合流程 ============ */
  async startPlayerTurn(first) {
    const C = this.C;
    if (!C || C.over) return;
    C.busy = true;
    C.selected = -1;
    C.targetingItem = null;
    C.turn += 1;

    const p = G.state.player;
    C.player.block = 0;
    C.energy = C.maxEnergy;

    /* 玩家中毒结算 */
    if (C.player.statuses.poison) {
      const dmg = C.player.statuses.poison;
      p.hp = Math.max(0, p.hp - dmg);
      C.player.statuses.poison -= 1;
      UI.log('☠️ 中毒：-' + dmg + ' 生命', 'battle');
      this.renderAll();
      UI.float($('#p-avatar'), '-' + dmg, 'dmg');
      if (p.hp <= 0) { this.lose(); return; }
      await sleep(450);
    }

    /* 敌人选择意图 */
    for (const e of C.enemies) {
      if (e.hp <= 0) continue;
      e.intent = this.pickMove(e);
    }

    this.drawCards(5);
    C.busy = false;
    this.renderAll();
  },

  pickMove(e) {
    const base = DATA.ENEMIES[e.base];
    const moves = base.moves;
    let total = 0;
    for (const m of moves) total += (m.w || 1);
    let pick = () => {
      let r = Math.random() * total;
      for (const m of moves) { r -= (m.w || 1); if (r <= 0) return m; }
      return moves[moves.length - 1];
    };
    let m = pick();
    if (m === e.lastMove && moves.length > 1 && Math.random() < 0.6) m = pick();
    e.lastMove = m;
    return m;
  },

  drawCards(n) {
    const C = this.C;
    for (let i = 0; i < n; i++) {
      if (C.hand.length >= 10) break;
      if (C.draw.length === 0) {
        if (C.discard.length === 0) break;
        C.draw = shuffle(C.discard.splice(0));
      }
      C.hand.push(C.draw.pop());
    }
  },

  /* ============ 出牌 ============ */
  async onCardClick(idx) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const card = DATA.CARDS[C.hand[idx]];
    if (!card) return;

    if (card.cost > C.energy) { UI.toast('行动力不足', 'bad'); return; }

    /* 需要选择目标 */
    if (card.target === 'enemy') {
      const alive = C.enemies.filter((e) => e.hp > 0);
      if (alive.length === 1) { await this.playCard(idx, alive[0].uid); return; }
      if (C.selected === idx) { C.selected = -1; this.renderAll(); return; }
      C.selected = idx;
      C.targetingItem = null;
      this.renderAll();
      UI.toast('选择一个目标', '');
      return;
    }
    await this.playCard(idx, null);
  },

  async onEnemyClick(uid) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const e = C.enemies.find((x) => x.uid === uid);
    if (!e || e.hp <= 0) return;
    if (C.selected >= 0) { await this.playCard(C.selected, uid); return; }
    if (C.targetingItem) { await this.useItemCombat(C.targetingItem, uid); return; }
  },

  async playCard(idx, targetUid) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const cardId = C.hand[idx];
    const card = DATA.CARDS[cardId];
    if (!card || card.cost > C.energy) return;

    C.busy = true;
    C.energy -= card.cost;
    C.hand.splice(idx, 1);
    C.discard.push(cardId);
    C.selected = -1;
    C.targetingItem = null;
    Sfx.play(card.type === 'attack' ? 'card' : 'card');

    const fx = card.fx || {};
    const gb = gearBonus(G.state);
    const target = targetUid ? C.enemies.find((x) => x.uid === targetUid) : null;

    /* 攻击: 单体（可多次） */
    if (fx.dmg && card.type === 'attack') {
      let base = fx.dmg + gb.atk;
      if (fx.special === 'execute' && target) {
        base = (target.hp / target.maxHp < 0.4) ? 22 + gb.atk : 9 + gb.atk;
      }
      const times = fx.times || 1;
      for (let i = 0; i < times; i++) {
        if (!target || target.hp <= 0) break;
        await this.hitEnemy(target, base);
        await sleep(240);
      }
    }

    /* 攻击: 全体 */
    if (fx.dmgAll) {
      const base = fx.dmgAll + gb.atk;
      for (const e of C.enemies.filter((x) => x.hp > 0)) {
        await this.hitEnemy(e, base);
        await sleep(160);
      }
    }

    /* 目标状态 */
    if (fx.statusEnemy && target && target.hp > 0) {
      this.addStatus(target, fx.statusEnemy);
      this.renderAll();
    }
    /* 全体敌人状态 */
    if (fx.statusAllEnemy) {
      for (const e of C.enemies.filter((x) => x.hp > 0)) this.addStatus(e, fx.statusAllEnemy);
      this.renderAll();
    }
    /* 自身状态 / 护甲 / 恢复 / 抽牌 / 行动力 */
    if (fx.block) {
      const b = fx.block + gb.def;
      C.player.block += b;
      UI.float($('#p-block'), '🛡+' + b, 'block');
      Sfx.play('block');
      this.renderAll();
    }
    if (fx.statusSelf) {
      this.addStatus(C.player, fx.statusSelf);
      UI.float($('#p-avatar'), '⬆ 强化', 'buff');
      this.renderAll();
    }
    if (fx.heal) this.healPlayer(fx.heal);
    if (fx.cleanse) {
      const st = C.player.statuses;
      for (const k of ['poison', 'weak', 'vuln']) delete st[k];
      this.renderAll();
    }
    if (fx.draw) { this.drawCards(fx.draw); this.renderAll(); }
    if (fx.energy) { C.energy += fx.energy; this.renderAll(); }

    /* 胜负判定 */
    if (C.enemies.every((e) => e.hp <= 0)) { await this.win(); return; }

    C.busy = false;
    this.renderAll();
  },

  /* ============ 伤害结算 ============ */
  calcDmg(base, atkSt, tgtSt) {
    let d = base + (atkSt.strength || 0);
    if (atkSt.weak) d = Math.floor(d * 0.75);
    if (tgtSt.vuln) d = Math.floor(d * 1.5);
    return Math.max(0, d);
  },

  async hitEnemy(e, base) {
    const C = this.C;
    if (!C || !G.state) return;
    const dmg = this.calcDmg(base, C.player.statuses, e.statuses);
    let rest = dmg;
    if (e.block > 0) {
      const ab = Math.min(e.block, rest);
      e.block -= ab; rest -= ab;
    }
    if (rest > 0) e.hp = Math.max(0, e.hp - rest);

    Sfx.play('hit');
    this.renderAll();
    const el = document.querySelector('[data-uid="' + e.uid + '"]');
    UI.float(el, '-' + dmg, 'dmg');
    UI.shake(el);
    UI.log('⚔️ 你对 ' + e.name + ' 造成 ' + dmg + ' 点伤害', 'battle');

    if (e.hp <= 0) {
      G.state.stats.kills += 1;
      UI.log('💀 ' + e.name + ' 倒下了', 'battle');
      this.renderAll();
      await sleep(320);
    }
  },

  healPlayer(n) {
    if (!G.state) return;
    const p = G.state.player;
    const amt = Math.min(n, p.maxHp - p.hp);
    if (amt > 0) {
      p.hp += amt;
      UI.float($('#p-avatar'), '+' + amt, 'heal');
      Sfx.play('heal');
      UI.log('💚 恢复 ' + amt + ' 点生命', 'gain');
    }
    this.renderAll();
    UI.renderChar();
  },

  addStatus(entity, st) {
    for (const k in st) {
      entity.statuses[k] = Math.min(9, (entity.statuses[k] || 0) + st[k]);
    }
  },

  statusChips(st) {
    let html = '';
    for (const k in st) {
      if (!st[k] || !STATUS_INFO[k]) continue;
      html += '<span class="status-chip st-' + k + '">' + STATUS_INFO[k].icon + STATUS_INFO[k].name + ' ' + st[k] + '</span>';
    }
    return html;
  },

  /* ============ 敌方回合 ============ */
  async endTurn() {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    C.busy = true;
    C.selected = -1;
    C.targetingItem = null;
    Sfx.play('click');

    /* 手牌弃置，玩家虚弱/易伤递减 */
    C.discard.push(...C.hand.splice(0));
    const st = C.player.statuses;
    if (st.weak) st.weak -= 1;
    if (st.vuln) st.vuln -= 1;
    this.renderAll();
    await sleep(420);

    for (const e of C.enemies) {
      if (C.over) return;
      if (e.hp <= 0) continue;

      e.block = 0;
      /* 敌人中毒 */
      if (e.statuses.poison) {
        const pd = e.statuses.poison;
        e.hp = Math.max(0, e.hp - pd);
        e.statuses.poison -= 1;
        this.renderAll();
        UI.float(document.querySelector('[data-uid="' + e.uid + '"]'), '-' + pd + '(毒)', 'dmg');
        await sleep(420);
        if (!G.state || C.over) return;
        if (e.hp <= 0) { G.state.stats.kills += 1; UI.log('💀 ' + e.name + ' 中毒身亡', 'battle'); continue; }
      }

      const move = e.intent || this.pickMove(e);
      const base = DATA.ENEMIES[e.base];

      /* 自身强化 */
      if (move.self) {
        this.addStatus(e, move.self);
        UI.float(document.querySelector('[data-uid="' + e.uid + '"]'), '⬆ 强化', 'buff');
        UI.log('⬆ ' + e.name + ' 使用了 ' + move.name, 'battle');
        this.renderAll();
        await sleep(520);
      }

      /* 敌方护甲 */
      if (move.block) {
        e.block += move.block;
        UI.float(document.querySelector('[data-uid="' + e.uid + '"]'), '🛡+' + move.block, 'block');
        UI.log('🛡 ' + e.name + ' 使用了 ' + move.name, 'battle');
        this.renderAll();
        await sleep(520);
      }

      /* 攻击 */
      if (move.dmg) {
        const times = move.times || 1;
        UI.log('⚔️ ' + e.name + ' 使用了 ' + move.name, 'battle');
        for (let i = 0; i < times; i++) {
          if (!G.state || C.over || G.state.player.hp <= 0) break;
          const dmg = this.calcDmg(move.dmg, e.statuses, C.player.statuses);
          await this.applyPlayerDamage(dmg, e.name);
          await sleep(300);
        }
      }

      /* 给玩家的状态 */
      if (move.toPlayer) {
        this.addStatus(C.player, move.toPlayer);
        UI.float($('#p-avatar'), '☠ 诅咒', 'buff');
        UI.log('☠️ ' + e.name + ' 使用了 ' + move.name, 'battle');
        this.renderAll();
        await sleep(480);
      }

      /* 汲取（伤害附带回复已计入 dmg 步骤） */
      if (move.heal && move.dmg) {
        e.hp = Math.min(e.maxHp, e.hp + move.heal);
        UI.float(document.querySelector('[data-uid="' + e.uid + '"]'), '+' + move.heal, 'heal');
        this.renderAll();
        await sleep(360);
      }

      /* 敌人虚弱/易伤递减 */
      if (e.statuses.weak) e.statuses.weak -= 1;
      if (e.statuses.vuln) e.statuses.vuln -= 1;

      if (!G.state || C.over) return;
      if (G.state.player.hp <= 0) { this.lose(); return; }
      await sleep(260);
    }

    if (C.over) return;
    /* 毒杀等非出牌击杀：敌方回合结束时也要结算胜利 */
    if (C.enemies.every((e) => e.hp <= 0)) { await this.win(); return; }
    this.startPlayerTurn();
  },

  async applyPlayerDamage(dmg, sourceName) {
    const C = this.C;
    if (!C || !G.state) return;
    let rest = dmg;
    if (C.player.block > 0) {
      const ab = Math.min(C.player.block, rest);
      C.player.block -= ab; rest -= ab;
      if (ab > 0) UI.float($('#p-block'), '🛡-' + ab, 'block');
    }
    if (rest > 0) {
      G.state.player.hp = Math.max(0, G.state.player.hp - rest);
      UI.float($('#p-avatar'), '-' + rest, 'dmg');
      UI.shake($('#view-combat'));
      Sfx.play('hit');
      UI.log('💢 ' + sourceName + ' 对你造成 ' + rest + ' 点伤害', 'battle');
    } else if (dmg > 0) {
      Sfx.play('block');
    }
    this.renderAll();
    UI.renderChar();
  },

  /* ============ 胜负 ============ */
  async win() {
    const C = this.C;
    if (!G.state) return;
    C.over = true;
    C.busy = true;
    Sfx.play('win');
    UI.log('🎉 战斗胜利！', 'gain');

    /* 奖励结算 */
    let gold = 0, xp = 0;
    for (const e of C.enemies) {
      const base = DATA.ENEMIES[e.base];
      const range = base.gold || [5, 10];
      gold += range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
      xp += base.xp || 10;
    }
    G.state.player.gold += gold;
    gainXp(G.state, xp);
    UI.log('💰 战利品 ' + gold + ' 金币', 'gain');
    UI.renderHud();

    let potionDrop = null;
    if (Math.random() < 0.28 && !C.enemies.some((e) => e.boss)) {
      const r = Math.random();
      potionDrop = r < 0.55 ? 'potion' : r < 0.8 ? 'firebomb' : 'energy_potion';
      G.state.items[potionDrop] = (G.state.items[potionDrop] || 0) + 1;
    }

    /* 三选一卡牌 */
    const pool = Object.values(DATA.CARDS).filter((c) =>
      (c.rarity === 'common' || c.rarity === 'rare') && (!c.cls || c.cls === G.state.player.cls));
    const picks = [];
    const poolCopy = pool.slice();
    for (let i = 0; i < 3 && poolCopy.length; i++) {
      picks.push(poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0]);
    }
    C.rewards = { gold, xp, potionDrop, picks };
    Save.write(G.state);
    await sleep(700);
    this.renderAll();
  },

  pickReward(cardId) {
    const C = this.C;
    if (!C || !C.rewards) return;
    G.state.deck.push(cardId);
    UI.toast('🂠 【' + DATA.CARDS[cardId].name + '】加入牌组', 'good');
    Sfx.play('card');
    Save.write(G.state);
    const winScene = C.winScene;
    this.C = null;
    Story.goto(winScene);
  },

  skipReward() {
    const C = this.C;
    if (!C) return;
    const winScene = C.winScene;
    this.C = null;
    Story.goto(winScene);
  },

  async lose() {
    const C = this.C;
    if (C) { C.over = true; C.busy = true; } /* 战斗外（剧情致死）也可复用 */
    Sfx.play('lose');
    UI.log('💀 你倒下了……', 'battle');
    await sleep(800);
    Main.showDeath();
  },

  /* ============ 战斗中物品 ============ */
  async onItemCombat(itemId) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const it = DATA.ITEMS[itemId];
    if (!it || !it.use || !(G.state.items[itemId] > 0)) return;

    if (itemId === 'firebomb') {
      const alive = C.enemies.filter((e) => e.hp > 0);
      if (alive.length === 1) { await this.useItemCombat(itemId, alive[0].uid); return; }
      C.targetingItem = itemId;
      C.selected = -1;
      this.renderAll();
      UI.toast('选择目标', '');
      return;
    }
    await this.useItemCombat(itemId, null);
  },

  async useItemCombat(itemId, targetUid) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const it = DATA.ITEMS[itemId];
    const use = it.use;
    C.busy = true;
    C.targetingItem = null;
    G.state.items[itemId] -= 1;
    if (G.state.items[itemId] <= 0) delete G.state.items[itemId];
    UI.log('🎒 使用 ' + it.name, 'gain');

    if (use.heal) this.healPlayer(use.heal);
    if (use.energy) { C.energy += use.energy; this.renderAll(); }
    if (use.cleanse) {
      for (const k of ['poison', 'weak', 'vuln']) delete C.player.statuses[k];
      this.renderAll();
    }
    if (use.dmg) {
      const target = targetUid ? C.enemies.find((x) => x.uid === targetUid) : C.enemies.find((x) => x.hp > 0);
      if (target) {
        await this.hitEnemy(target, use.dmg);
        if (C.enemies.every((e) => e.hp <= 0)) { await this.win(); return; }
      }
    }
    Sfx.play('heal');
    C.busy = false;
    this.renderAll();
  },

  /* ============ 渲染 ============ */
  intentHtml(e) {
    const m = e.intent;
    if (!m) return '❓';
    const parts = [];
    if (m.dmg) {
      const per = this.calcDmg(m.dmg, e.statuses, {});
      parts.push('⚔️ ' + per + (m.times > 1 ? '×' + m.times : ''));
    }
    if (m.block) parts.push('🛡️ ' + m.block);
    if (m.self) parts.push('⬆️ 强化');
    if (m.toPlayer) parts.push('☠️ 诅咒');
    if (m.heal) parts.push('💚');
    return parts.join(' ') || '❓';
  },

  enemyHtml(e) {
    const targetable = this.C.selected >= 0 || this.C.targetingItem;
    return '<div class="enemy-card' + (e.hp <= 0 ? ' dead' : '') +
      (targetable && e.hp > 0 ? ' targetable' : '') + (e.boss ? ' boss' : '') +
      '" data-uid="' + e.uid + '">' +
      '<div class="e-intent">' + (e.hp > 0 ? this.intentHtml(e) : '—') + '</div>' +
      '<div class="e-art">' + e.art + '</div>' +
      '<div class="e-name">' + (e.boss ? '<span class="boss-tag">头目</span>' : '') + e.name + '</div>' +
      '<div class="bar ehp"><div class="fill" style="width:' + (e.hp / e.maxHp * 100) + '%"></div></div>' +
      '<div class="e-hpnum">' + e.hp + ' / ' + e.maxHp + (e.block > 0 ? '　<span class="block-chip">🛡 ' + e.block + '</span>' : '') + '</div>' +
      '<div class="e-chips">' + this.statusChips(e.statuses) + '</div>' +
      '</div>';
  },

  renderAll() {
    const C = this.C;
    if (!C) return;
    const view = $('#view-combat');

    /* 奖励界面 */
    if (C.over === true && C.rewards) { view.innerHTML = this.rewardHtml(); this.bindReward(); return; }

    const p = G.state.player;
    const cls = DATA.CLASSES[p.cls];

    let html = '<div class="c-enemies">';
    for (const e of C.enemies) html += this.enemyHtml(e);
    html += '</div>';

    html +=
      '<div class="c-mid">' +
      '<div class="p-block" id="p-block">🛡 ' + C.player.block + '</div>' +
      '<div class="p-avatar" id="p-avatar">' + cls.art + '</div>' +
      '<div class="p-info">' +
      '<div class="bar-label"><span>' + cls.name + '</span><span>' + p.hp + ' / ' + p.maxHp + '</span></div>' +
      '<div class="bar hp"><div class="fill" style="width:' + (p.hp / p.maxHp * 100) + '%"></div></div>' +
      '<div class="p-chips">' + this.statusChips(C.player.statuses) + '</div>' +
      '</div>' +
      '<div class="p-energy">⚡ ' + C.energy + ' / ' + C.maxEnergy + '</div>' +
      '</div>';

    /* 物品栏 */
    html += '<div class="c-hand-area">';
    html += '<div class="c-itembar">';
    for (const id in G.state.items) {
      const it = DATA.ITEMS[id];
      if (!it || !it.use || !(G.state.items[id] > 0)) continue;
      html += '<button class="itembtn" data-itembtn="' + id + '">' + it.art + ' ' + it.name + (G.state.items[id] > 1 ? ' ×' + G.state.items[id] : '') + '</button>';
    }
    html += '</div>';

    /* 手牌 */
    html += '<div class="c-hand" id="hand">';
    C.hand.forEach((cid, i) => {
      const card = DATA.CARDS[cid];
      const afford = card.cost <= C.energy;
      html += UI.cardHtml(card, {
        dataIdx: i,
        cls: (afford ? '' : 'unaffordable') + (C.selected === i ? ' selected' : ''),
      });
    });
    html += '</div>';

    html +=
      '<div class="c-controls">' +
      '<span class="pile-chip">🂠 抽牌堆 ' + C.draw.length + '</span>' +
      '<span class="pile-chip">🗑 弃牌堆 ' + C.discard.length + '</span>' +
      '<span class="pile-chip">回目 ' + C.turn + '</span>' +
      '<button class="endturn-btn" id="btn-endturn"' + (C.busy || C.over ? ' disabled' : '') + '>结束回合 (E)</button>' +
      '</div>';

    html += '</div>';
    view.innerHTML = html;
    this.bindCombat();
  },

  rewardHtml() {
    const C = this.C;
    const r = C.rewards;
    let html = '<div class="reward-wrap">';
    html += '<div class="reward-title">🎉 战斗胜利</div>';
    html += '<div class="reward-sub">💰 +' + r.gold + ' 金币　⭐ +' + r.xp + ' 经验' +
      (r.potionDrop ? '　' + DATA.ITEMS[r.potionDrop].art + ' ' + DATA.ITEMS[r.potionDrop].name + ' ×1' : '') + '</div>';
    if (r.picks.length) {
      html += '<div class="reward-sub">选择一张卡牌加入牌组：</div><div class="reward-cards">';
      r.picks.forEach((c) => { html += UI.cardHtml(c, { cls: 'reward-card', dataIdx: c.id }); });
      html += '</div>';
      html += '<button class="ghost-btn skip-reward" id="btn-skip-reward">放弃奖励，继续旅程</button>';
    } else {
      html += '<button class="title-btn skip-reward" id="btn-skip-reward" style="width:auto;padding:10px 40px">继续旅程</button>';
    }
    html += '</div>';
    return html;
  },

  bindReward() {
    const C = this.C;
    $$('#view-combat .reward-card').forEach((el) => {
      el.onclick = () => this.pickReward(el.dataset.cardIdx);
    });
    const skip = $('#btn-skip-reward');
    if (skip) skip.onclick = () => this.skipReward();
  },

  bindCombat() {
    const C = this.C;
    $$('#view-combat .card[data-card-idx]').forEach((el) => {
      el.onclick = () => this.onCardClick(parseInt(el.dataset.cardIdx, 10));
    });
    $$('#view-combat .enemy-card').forEach((el) => {
      el.onclick = () => this.onEnemyClick(el.dataset.uid);
    });
    $$('#view-combat [data-itembtn]').forEach((el) => {
      el.onclick = () => this.onItemCombat(el.dataset.itembtn);
    });
    const end = $('#btn-endturn');
    if (end) end.onclick = () => this.endTurn();
  },

  /* 快捷键 */
  hotkey(n) {
    const C = this.C;
    if (!C || C.busy || C.over) return;
    const idx = n - 1;
    if (idx < C.hand.length) this.onCardClick(idx);
  },
};
