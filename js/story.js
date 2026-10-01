'use strict';
/* ============================================================
   星坠之谜 — 剧情引擎
   ============================================================ */

const Story = {

  /* 进入场景 */
  goto(id, depth) {
    depth = depth || 0;
    if (depth > 8) return;
    const scene = DATA.SCENES[id];
    if (!scene) { console.error('场景不存在: ' + id); return; }

    /* 通关结算：进入结局场景时记录周目（须在求值结局文本之前，
       文本里的"周目 N 已记入星图"才能读到最新数字） */
    if (G.state && id.indexOf('ending_') === 0 && !G.state.flags.cycleCounted) {
      G.state.flags.cycleCounted = true;
      Cycle.recordClear(G.state);
    }

    /* 文本在 onEnter 之前求值：onEnter 常用于记录"已到访"之类的状态，
       若在其之后取文本，场景自己的首次/再次分支就永远读不到"进入前"的状态。 */
    const rawText = scene.text;
    const text = G.state
      ? ((typeof rawText === 'function') ? rawText(G.state) : rawText)
      : (typeof rawText === 'function' ? '' : rawText);

    let extra = null;
    if (scene.onEnter && G.state) {
      const r = scene.onEnter(G.state);
      if (typeof r === 'string' && DATA.SCENES[r]) { this.goto(r, depth + 1); return; }
      if (typeof r === 'string') extra = r;
    }

    if (G.state) { G.state.scene = id; Codex.markState(G.state); Achieve.check(G.state); }
    UI.showView('story');
    UI.renderChar();
    UI.renderHud();

    /* 结局场景不再存档 */
    if (id.indexOf('ending_') === 0) {
      Save.clear();
    } else if (G.state) {
      Save.write(G.state);
    }

    const full = extra ? (extra + '\n\n' + text) : text;
    UI.typewriter($('#scene-text'), full, () => this.renderChoices(scene));
  },

  /* 渲染选项 */
  renderChoices(scene) {
    const box = $('#choices');
    box.innerHTML = '';
    const s = G.state || { player: { gold: 0 }, flags: {}, items: {} };

    for (const ch of (scene.choices || [])) {
      if (ch.show && !ch.show(s)) continue;
      if (ch.once && s.flags[ch.once]) continue;

      const btn = document.createElement('button');
      btn.className = 'choice-btn' + (ch.combat ? ' combat-choice' : '') + (ch.check ? ' check-choice' : '');

      const label = (typeof ch.text === 'function') ? (ch.text(s) || '') : ch.text;
      let sub = (ch.subFn ? ch.subFn(s) : null) || ch.sub || '';
      let disabled = false;

      if (ch.requireGold && s.player.gold < ch.requireGold) {
        disabled = true;
        sub = (sub ? sub + ' · ' : '') + '金币不足';
      }
      if (ch.disabled && ch.disabled(s)) {
        disabled = true;
        if (!sub) sub = '暂不可用';
      }

      btn.disabled = disabled;
      btn.innerHTML = label + (sub ? '<span class="choice-sub' + (disabled ? ' locked' : '') + '">' + sub + '</span>' : '');

      btn.onclick = () => this.choose(ch);
      box.appendChild(btn);
    }

    if (box.children.length === 0) {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = '…… 继续';
      btn.onclick = () => this.goto(s.scene);
      box.appendChild(btn);
    }
  },

  /* 点击选项 */
  choose(ch) {
    const s = G.state;
    Sfx.play('click');

    if (ch.once) s.flags[ch.once] = true;

    /* 特殊选项 */
    if (ch.special === 'class') {
      const ng = Main.pendingNG || null;
      Main.pendingNG = null;
      const endless = Main.pendingMode === 'endless';
      Main.pendingMode = null;
      G.state = newGameState(ch.cls, ng ? { cycle: ng.cycle, relics: ng.relics, gold: ng.gold } : {});
      if (endless) G.state.flags.endless = true;
      UI.log('✦ 新的冒险开始：' + DATA.CLASSES[ch.cls].name +
        (G.state.flags.endless ? '（迷雾回廊 · 无尽挑战）' : '') +
        (G.state.cycle > 1 ? '（第 ' + G.state.cycle + ' 周目 · 继承遗物 ' + G.state.relics.length + ' 件）' : ''), 'sys');
      this.goto('difficulty');
      return;
    }
    if (ch.special === 'set_diff') {
      G.state.diff = ch.diff;
      UI.log('⚖️ 行程难度：' + (ch.diff ? '迷雾试炼（困难）' : '磨砺（标准）'), 'sys');
      this.goto((G.state.flags && G.state.flags.endless) ? 'endless_intro' : 'prologue');
      return;
    }
    if (ch.special === 'endless_fight') {
      Combat.start(endlessGroupKey((s.flags.endlessDepth || 0) + 1), 'endless_clear');
      return;
    }
    if (ch.special === 'endless_relic') {
      const picks = Array.isArray(s.flags.endlessPicks) ? s.flags.endlessPicks : [];
      const id = picks[ch.pickIndex || 0];
      delete s.flags.endlessPicks;
      if (id && DATA.RELICS[id]) applyEffects(s, { relic: id });
      Save.write(s);
      this.goto('endless_lobby');
      return;
    }
    if (ch.special === 'endless_rest') {
      const cost = 20 + (s.flags.endlessDepth || 0) * 5;
      if (s.player.hp >= s.player.maxHp) { UI.toast('生命已满，无需休整', 'bad'); return; }
      if (s.player.gold < cost) { UI.toast('金币不足（需要 ' + cost + '）', 'bad'); return; }
      s.player.gold -= cost;
      const amt = Math.min(Math.round(s.player.maxHp * 0.4), s.player.maxHp - s.player.hp);
      s.player.hp += amt;
      UI.log('🛖 营地休整：花费 ' + cost + ' 金币，恢复 ' + amt + ' 点生命', 'gain');
      UI.toast('🛖 休整完毕：恢复 ' + amt + ' 点生命', 'good');
      Sfx.play('heal');
      UI.renderChar();
      UI.renderHud();
      Save.write(s);
      this.goto('endless_lobby');
      return;
    }
    if (ch.special === 'forget_card') {
      if (s.player.gold < (ch.requireGold || 0)) { UI.toast('金币不足', 'bad'); return; }
      if (s.deck.length <= 6) { UI.toast('牌组至少保留 6 张', 'bad'); return; }
      UI.deckModal(true);
      return;
    }
    if (ch.special === 'to_title') {
      Main.showTitle();
      return;
    }

    /* 效果结算（特殊：职业卡牌购买） */
    if (ch.fx) {
      const fx = Object.assign({}, ch.fx);
      if (fx.special === 'class_card') {
        fx.card = DATA.CLASS_CARDS[s.player.cls];
        delete fx.special;
      }
      applyEffects(s, fx);
      UI.renderChar();
      UI.renderHud();
      /* 剧情效果致死：战斗外没有濒死流程，直接进入死亡结算 */
      if (s.player.hp <= 0) { Combat.lose(); return; }
    }

    /* 属性检定 */
    if (ch.check) {
      const statNames = { pow: '力量', agi: '敏捷', int: '智力', cha: '魅力' };
      const mod = checkMod(s, ch.check.stat);
      const roll = 1 + Math.floor(Math.random() * 20);
      const total = roll + mod;
      const ok = total >= ch.check.dc;
      s.stats.checks += 1;
      Sfx.play('check');
      const diceLine = '🎲 ' + statNames[ch.check.stat] + '检定：骰 ' + roll + ' + 加值 ' + mod + ' = ' + total +
        (ok ? ' ≥ ' : ' < ') + ch.check.dc + (ok ? ' → 成功！' : ' → 失败…') + '\n\n';
      const payload = ok ? ch.success : ch.fail;
      if (payload && payload.fx) {
        applyEffects(s, payload.fx);
        UI.renderChar();
        UI.renderHud();
        if (s.player.hp <= 0) { Combat.lose(); return; }
      }
      this.outcome(diceLine + (payload ? payload.text : ''), payload);
      return;
    }

    /* 战斗 */
    if (ch.combat) {
      Combat.start(ch.combat, ch.win);
      return;
    }

    /* 跳转 */
    if (ch.go) {
      this.goto(ch.go);
    }
  },

  /* 检定结果过场 */
  outcome(text, payload) {
    const box = $('#choices');
    box.innerHTML = '';
    UI.typewriter($('#scene-text'), text, () => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = payload && payload.combat ? '⚔️ 应战' : '▶ 继续';
      btn.onclick = () => {
        if (payload && payload.combat) Combat.start(payload.combat, payload.win);
        else if (payload && payload.go) this.goto(payload.go);
        else this.goto(G.state.scene);
      };
      box.appendChild(btn);
    });
  },

  /* 刷新面板（不重打文字） */
  rerender() {
    UI.renderChar();
    UI.renderHud();
  },
};
