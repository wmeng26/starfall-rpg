'use strict';
/* ============================================================
   星坠之谜 — UI 组件 / 音效
   ============================================================ */

/* 全局运行时容器 */
const G = { state: null };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ============================ 音效（WebAudio 合成） ============================ */
const Sfx = {
  ctx: null,
  enabled: true,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type, vol, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, vol, delay) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = vol || 0.18;
    src.buffer = buf;
    src.connect(g); g.connect(this.ctx.destination);
    src.start(t0);
  },
  play(name) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone(660, 0.06, 'square', 0.04); break;
      case 'card': this.tone(520, 0.07, 'triangle', 0.08); this.tone(760, 0.07, 'triangle', 0.06, 0.05); break;
      case 'hit': this.noise(0.12, 0.16); this.tone(150, 0.12, 'sawtooth', 0.1); break;
      case 'block': this.tone(300, 0.08, 'triangle', 0.1); this.tone(230, 0.1, 'triangle', 0.08, 0.05); break;
      case 'heal': this.tone(523, 0.1, 'sine', 0.1); this.tone(659, 0.1, 'sine', 0.1, 0.09); this.tone(784, 0.14, 'sine', 0.1, 0.18); break;
      case 'coin': this.tone(880, 0.06, 'square', 0.06); this.tone(1320, 0.09, 'square', 0.06, 0.06); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.1, i * 0.12)); break;
      case 'lose': [392, 311, 262, 196].forEach((f, i) => this.tone(f, 0.24, 'sawtooth', 0.08, i * 0.18)); break;
      case 'levelup': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.1, i * 0.1)); break;
      case 'check': this.tone(880, 0.1, 'sine', 0.07); this.tone(1100, 0.1, 'sine', 0.05, 0.08); break;
    }
  },
};

/* ============================ 基础 UI ============================ */
const UI = {
  /* 视图切换 */
  showView(name) {
    for (const v of ['title', 'story', 'combat', 'death']) {
      $('#view-' + v).hidden = (v !== name);
    }
  },

  /* Toast */
  toast(msg, kind) {
    const root = $('#toast-root');
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'bad' ? ' t-bad' : kind === 'good' ? ' t-good' : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2900);
    while (root.children.length > 4) root.firstChild.remove();
  },

  /* 日志 */
  log(msg, kind) {
    const box = $('#log');
    const line = document.createElement('div');
    line.className = 'l-' + (kind || 'sys');
    line.textContent = msg;
    box.appendChild(line);
    while (box.children.length > 60) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  },

  /* 打字机效果 */
  _twTimer: null,
  typewriter(elem, text, done) {
    if (this._twTimer) { clearInterval(this._twTimer); this._twTimer = null; }
    elem.innerHTML = '';
    const caret = '<span class="type-caret">▎</span>';
    let i = 0;
    const step = () => {
      i += 1;
      const shown = text.slice(0, i).replace(/\n/g, '<br>');
      elem.innerHTML = shown + (i < text.length ? caret : '');
      if (i >= text.length) {
        clearInterval(this._twTimer);
        this._twTimer = null;
        if (done) done();
      }
    };
    this._twTimer = setInterval(step, 17);
    elem.onclick = () => {
      if (this._twTimer) {
        clearInterval(this._twTimer);
        this._twTimer = null;
        elem.innerHTML = text.replace(/\n/g, '<br>');
        if (done) done();
      }
    };
    step();
  },

  /* 浮动数字 */
  float(anchor, text, cls) {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'float-num ' + (cls || 'dmg');
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2 - 20 + (Math.random() * 24 - 12)) + 'px';
    el.style.top = (rect.top + rect.height * 0.25) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 350);
  },

  /* 弹窗 */
  modal(title, contentHtml, onOpen) {
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML =
      '<div class="modal-box">' +
      '<button class="modal-close">✕</button>' +
      '<div class="modal-title">' + title + '</div>' +
      '<div class="modal-body">' + contentHtml + '</div>' +
      '</div>';
    $('#modal-root').appendChild(mask);
    const close = () => mask.remove();
    mask.addEventListener('click', (e) => { if (e.target === mask) close(); });
    mask.querySelector('.modal-close').onclick = close;
    if (onOpen) onOpen(mask);
    return { close, mask };
  },

  /* ---------- 角色面板 ---------- */
  renderChar() {
    const s = G.state;
    const panel = $('#charpanel');
    if (!s) { panel.innerHTML = ''; return; }
    $('#btn-panel').disabled = false;
    const p = s.player;
    const cls = DATA.CLASSES[p.cls];
    const gb = gearBonus(s);
    const statNames = { pow: '力量', agi: '敏捷', int: '智力', cha: '魅力' };

    let statChips = '';
    for (const k of ['pow', 'agi', 'int', 'cha']) {
      const base = p.stats[k], eff = effStat(s, k);
      statChips += '<span class="stat-chip clickable" data-stat="' + k + '" title="点击查看说明">' + statNames[k] + ' <b>' + eff + '</b>' + (eff !== base ? '<small style="color:var(--green)"> +</small>' : '') + '</span>';
    }

    const slotNames = { weapon: '武器', armor: '护甲', charm: '饰品' };
    let gearRows = '';
    for (const k of ['weapon', 'armor', 'charm']) {
      const id = p.gear[k];
      const gd = id ? DATA.GEAR[id] : null;
      gearRows += '<div class="gear-row"><span class="slot">' + slotNames[k] + '</span>' +
        (gd ? gd.name + ' <small style="color:var(--gold-dim)">' + gd.desc + '</small>' : '<span class="none">—</span>') + '</div>';
    }

    let relicRows = '';
    const relics = Array.isArray(s.relics) ? s.relics : [];
    if (!relics.length) {
      relicRows = '<div class="cp-hint">尚未获得 · 商店与隐秘处藏有星尘遗物</div>';
    }
    for (const id of relics) {
      const rd = DATA.RELICS[id];
      if (!rd) continue;
      relicRows += '<div class="gear-row"><span class="relic-icon">' + rd.icon + '</span><b>' + rd.name + '</b>' +
        '<div class="relic-desc">' + rd.desc + '</div></div>';
    }

    let itemRows = '';
    const itemIds = Object.keys(s.items).filter((k) => s.items[k] > 0);
    if (itemIds.length === 0) itemRows = '<div class="cp-hint">行囊空空</div>';
    /* 战斗中面板不提供"使用"：统一走战斗物品栏，避免无回合消耗地用药 */
    const inCombat = typeof Combat !== 'undefined' && !!Combat.C && !Combat.C.over;
    for (const id of itemIds) {
      const it = DATA.ITEMS[id];
      const usable = it.use && !it.combatOnly && !inCombat;
      itemRows +=
        '<div class="item-row"><span>' + it.art + ' ' + it.name + (s.items[id] > 1 ? ' ×' + s.items[id] : '') + '</span>' +
        (usable ? '<button class="item-use" data-item="' + id + '">使用</button>' : '') +
        '</div>';
    }
    if (inCombat) itemRows += '<div class="cp-hint">⚔️ 战斗中请在战斗物品栏使用物品</div>';

    const deckCounts = {};
    for (const c of s.deck) deckCounts[c] = (deckCounts[c] || 0) + 1;
    const deckSize = s.deck.length;

    const j = s.journal || { quests: [], notes: [] };
    const activeQuests = j.quests.filter((q) => q.status === 'active').length;

    panel.innerHTML =
      '<div class="cp-head"><div class="cp-avatar">' + cls.art + '</div>' +
      '<div><div class="cp-name">' + cls.name + '</div><div class="cp-sub">Lv.' + p.level + ' · 冒险者</div></div></div>' +

      '<div class="bar-wrap"><div class="bar-label"><span>生命</span><span>' + p.hp + ' / ' + p.maxHp + '</span></div>' +
      '<div class="bar hp"><div class="fill" style="width:' + Math.max(0, p.hp / p.maxHp * 100) + '%"></div></div></div>' +

      '<div class="bar-wrap"><div class="bar-label"><span>经验</span><span>' + p.xp + ' / ' + xpNeeded(p.level) + '</span></div>' +
      '<div class="bar xp"><div class="fill" style="width:' + (p.xp / xpNeeded(p.level) * 100) + '%"></div></div></div>' +

      '<div class="cp-section"><div class="cp-title">属 性</div><div class="stat-row">' + statChips + '</div>' +
      '<div class="cp-hint">🎲 点击属性查看用途 · 武器 +' + gb.atk + ' 攻击 · 护甲 +' + gb.def + ' 护甲值</div></div>' +

      '<div class="cp-section"><div class="cp-title">装 备</div>' + gearRows + '</div>' +

      '<div class="cp-section"><div class="cp-title">遗 物' + (relics.length ? '（' + relics.length + '）' : '') + '</div>' + relicRows + '</div>' +

      '<div class="cp-section"><div class="cp-title">行 囊</div>' + itemRows + '</div>' +

      '<div class="cp-section"><div class="cp-title">牌 组</div>' +
      '<div class="gear-row">🂠 共 ' + deckSize + ' 张（' + Object.keys(deckCounts).length + ' 种）' +
      ' <button class="ghost-btn" id="btn-deck" style="margin-left:8px">查看</button></div></div>' +

      '<div class="cp-section"><div class="cp-title">冒 险 笔 记</div>' +
      '<div class="gear-row">📜 任务 ' + activeQuests + ' 项 · 📓 情报 ' + j.notes.length + ' 条</div>' +
      '<button class="ghost-btn" id="btn-journal" style="margin-top:6px;width:100%">翻开笔记</button></div>';

    panel.querySelectorAll('.item-use').forEach((btn) => {
      btn.onclick = () => {
        useItemOutside(s, btn.dataset.item);
        if (typeof Story !== 'undefined' && Story.rerender) Story.rerender();
      };
    });
    const deckBtn = $('#btn-deck');
    if (deckBtn) deckBtn.onclick = () => UI.deckModal();
    const jb = $('#btn-journal');
    if (jb) jb.onclick = () => UI.journalModal();
    panel.querySelectorAll('.stat-chip.clickable').forEach((el) => {
      el.onclick = () => { Sfx.play('click'); UI.statsModal(el.dataset.stat); };
    });
  },

  /* 属性说明弹窗 */
  statsModal(openStat) {
    const info = {
      pow: { icon: '💪', name: '力量', desc: '膂力与威慑。用于搬举重物、破门开路、恐吓震慑等检定。', eg: '例如：山道上单手举起巨石，吓退劫掠者。' },
      agi: { icon: '🌀', name: '敏捷', desc: '身法与潜行。用于闪避陷阱、潜行绕行、轻步穿行等检定。', eg: '例如：黑松林里避开兽夹与绊索。' },
      int: { icon: '📖', name: '智力', desc: '学识与洞察。用于解读文字、寻找机关、施展净化咒文等检定。', eg: '例如：破译矿监日志、聆听墙中的搏动、净化星核。' },
      cha: { icon: '💬', name: '魅力', desc: '谈吐与人缘。用于打探情报、赢得好感、唤起他人记忆等检定。', eg: '例如：酒馆里套出传闻、唤起莫尔甘残存的记忆。' },
    };
    let html = '<div class="help-sec"><b>🎲 检定规则</b><br>剧情中的关键行动会进行属性检定：掷一枚 20 面骰，加上 <span class="k">属性 ×2</span> 的加值，达到难度（DC）即成功。失败也有后续——受伤、遇袭，或只是错过一段机缘。检定结果会记录在剧情文字与日志中。</div>';
    for (const k of ['pow', 'agi', 'int', 'cha']) {
      const d = info[k];
      const open = k === openStat;
      html += '<div class="help-sec"' + (open ? ' style="background:rgba(212,184,118,.07);border:1px solid var(--gold-dim);border-radius:8px;padding:8px 12px"' : '') + '><b>' + d.icon + ' ' + d.name + '</b><br>' + d.desc + '<br><small style="color:var(--dim)">' + d.eg + ' 装备饰品（护符、头灯等）可永久提升属性。</small></div>';
    }
    UI.modal('属 性 说 明', html);
  },

  /* 成就图鉴弹窗（跨周目，无需存档） */
  achieveModal() {
    const got = Achieve.all();
    let html = '';
    for (const id in DATA.ACHIEVEMENTS) {
      const a = DATA.ACHIEVEMENTS[id];
      const ok = got.has(id);
      html += '<div class="journal-item' + (ok ? '' : ' achv-locked') + '">' +
        '<div class="ji-head"><span class="achv-icon">' + (ok ? a.icon : '🔒') + '</span>' +
        '<b>' + (ok ? a.name : '？？？') + '</b></div>' +
        '<div class="ji-desc">' + a.desc + '</div></div>';
    }
    html += '<div class="cp-hint" style="margin-top:10px">🏆 已解锁 ' + got.size + ' / ' + Object.keys(DATA.ACHIEVEMENTS).length +
      ' · 成就跨周目保存，删除存档或通关清档均不影响。</div>';
    UI.modal('成 就 图 鉴', html);
  },

  /* 冒险图鉴弹窗（跨周目，无需存档）：卡牌 / 遗物 / 敌人 三栏 */
  codexModal(tab) {
    tab = tab || 'cards';
    const RARITY = { starter: '初始', common: '普通', rare: '稀有', boss: '头目' };
    const m = UI.modal('冒 险 图 鉴',
      '<div class="codex-tabs" id="codex-tabs"></div><div id="codex-body"></div>' +
      '<div class="cp-hint" id="codex-foot" style="text-align:center;margin-top:12px"></div>');

    const lockedCard = () =>
      '<div class="card codex-card locked type-skill">' +
      '<div class="card-cost">?</div>' +
      '<div class="card-name">？？？</div>' +
      '<div class="card-type">未收录</div>' +
      '<div class="card-art">🂠</div>' +
      '<div class="card-desc">获得这张牌后收录</div></div>';

    const render = () => {
      const d = Codex.all();
      const tabsDef = [
        ['cards', '🂠 卡牌', d.cards.length, Object.keys(DATA.CARDS).length],
        ['relics', '⚱️ 遗物', d.relics.length, Object.keys(DATA.RELICS).length],
        ['enemies', '👹 敌人', d.enemies.length, Object.keys(DATA.ENEMIES).length],
      ];
      $('#codex-tabs').innerHTML = tabsDef.map(([id, label, n, tot]) =>
        '<button class="codex-tab' + (id === tab ? ' on' : '') + '" data-tab="' + id + '">' +
        label + ' ' + n + '/' + tot + '</button>').join('');

      let body = '';
      if (tab === 'cards') {
        const groups = [['通用', null], ['战士', 'warrior'], ['法师', 'mage'], ['游侠', 'ranger']];
        const rarityOrder = { starter: 0, common: 1, rare: 2, boss: 3 };
        for (const [gName, cls] of groups) {
          const list = Object.values(DATA.CARDS)
            .filter((c) => (c.cls || null) === cls)
            .sort((a, b) => (rarityOrder[a.rarity] || 9) - (rarityOrder[b.rarity] || 9));
          if (!list.length) continue;
          const got = list.filter((c) => Codex.has('cards', c.id)).length;
          body += '<div class="codex-group-title">' + gName + ' <small>（' + got + '/' + list.length + '）</small></div><div class="codex-cards">';
          for (const c of list) {
            body += Codex.has('cards', c.id)
              ? UI.cardHtml(c, { cls: 'codex-card', tag: RARITY[c.rarity] || c.rarity })
              : lockedCard();
          }
          body += '</div>';
        }
      } else if (tab === 'relics') {
        body += '<div class="codex-grid">';
        for (const id in DATA.RELICS) {
          const r = DATA.RELICS[id];
          body += Codex.has('relics', id)
            ? '<div class="journal-item codex-relic"><div class="ji-head"><span class="relic-icon">' + r.icon + '</span><b>' + r.name + '</b></div><div class="ji-desc">' + r.desc + '</div></div>'
            : '<div class="journal-item codex-relic achv-locked"><div class="ji-head"><span class="relic-icon">🔒</span><b>？？？</b></div><div class="ji-desc">获得这件星尘遗物后收录。</div></div>';
        }
        body += '</div>';
      } else {
        body += '<div class="codex-grid">';
        for (const id in DATA.ENEMIES) {
          const e = DATA.ENEMIES[id];
          body += Codex.has('enemies', id)
            ? '<div class="journal-item codex-enemy"><div class="ji-head"><span class="codex-art">' + e.art + '</span><b>' + e.name + '</b>' + (e.boss ? '<span class="ji-kind">头目</span>' : '') + '</div><div class="ji-desc">生命 ' + e.hp + ' · 经验 ' + e.xp + '</div></div>'
            : '<div class="journal-item codex-enemy achv-locked"><div class="ji-head"><span class="codex-art">❓</span><b>？？？</b></div><div class="ji-desc">击败它之后收录。</div></div>';
        }
        body += '</div>';
      }
      $('#codex-body').innerHTML = body;
      $('#codex-foot').textContent = '📖 已收录 ' + Codex.count() + ' / ' + Codex.total() +
        ' · 图鉴跨周目累计，删除存档不影响';
      $$('#codex-tabs .codex-tab').forEach((b) => {
        b.onclick = () => { Sfx.play('click'); tab = b.dataset.tab; render(); };
      });
    };
    render();
  },

  /* 冒险笔记弹窗：任务 + 情报线索 */
  journalModal() {
    const s = G.state;
    if (!s) return;
    const j = s.journal || { quests: [], notes: [] };
    let html = '';

    html += '<div class="cp-title" style="margin-bottom:8px">📜 任 务</div>';
    if (!j.quests.length) html += '<div class="cp-hint" style="margin-bottom:10px">暂无任务。去镇中心的告示板看看吧。</div>';
    for (const q of j.quests) {
      const qd = DATA.QUESTS[q.id];
      if (!qd) continue;
      const done = q.status === 'done';
      html += '<div class="journal-item' + (done ? ' done' : '') + '">' +
        '<div class="ji-head"><span class="ji-kind">' + qd.kind + '</span><b>' + qd.name + '</b>' +
        '<span class="ji-status">' + (done ? '✅ 已完成' : '⏳ 进行中') + '</span></div>' +
        '<div class="ji-desc">' + qd.desc + '</div></div>';
    }

    html += '<div class="cp-title" style="margin:16px 0 8px">📓 情 报 与 线 索</div>';
    if (!j.notes.length) html += '<div class="cp-hint">还没有记录。多和镇民聊聊，多翻翻角落里的东西。</div>';
    for (const n of j.notes) {
      const nd = DATA.NOTES[n.id];
      if (!nd) continue;
      html += '<div class="journal-item"><div class="ji-head"><b>' + nd.title + '</b></div>' +
        '<div class="ji-desc">' + nd.text + '</div></div>';
    }
    UI.modal('冒 险 笔 记', html);
  },

  /* 牌组浏览弹窗 */
  deckModal() {
    const s = G.state;
    const counts = {};
    for (const c of s.deck) counts[c] = (counts[c] || 0) + 1;
    let html = '<div style="text-align:center">';
    for (const id in counts) {
      html += UI.cardHtml(DATA.CARDS[id], { count: counts[id], cls: 'deck-card' });
    }
    html += '</div>';
    html += '<div style="text-align:center;margin-top:10px"><button class="ghost-btn" id="btn-codex">📖 查看全图鉴</button></div>';
    const m = UI.modal('牌 组（' + s.deck.length + ' 张）', html);
    const cb = m.mask.querySelector('#btn-codex');
    if (cb) cb.onclick = () => { m.close(); UI.codexModal('cards'); };
  },

  /* 卡牌 HTML */
  cardHtml(card, opts) {
    opts = opts || {};
    const typeIcon = { attack: '⚔️ 攻击', skill: '🛡️ 技能', power: '✨ 能力' }[card.type];
    return '<div class="card type-' + card.type + (opts.cls ? ' ' + opts.cls : '') + '"' +
      (opts.dataIdx !== undefined ? ' data-card-idx="' + opts.dataIdx + '"' : '') + '>' +
      (opts.tag ? '<span class="card-count">' + opts.tag + '</span>' : '') +
      (opts.count ? '<span class="card-count">×' + opts.count + '</span>' : '') +
      '<div class="card-cost">' + card.cost + '</div>' +
      '<div class="card-name">' + card.name + '</div>' +
      '<div class="card-type">' + typeIcon + '</div>' +
      '<div class="card-art">' + (card.type === 'attack' ? '⚔️' : card.type === 'skill' ? '🛡️' : '✨') + '</div>' +
      '<div class="card-desc">' + card.desc + '</div>' +
      '</div>';
  },

  /* 金币 HUD */
  renderHud() {
    if (!G.state) { $('#hud-gold').textContent = '💰 —'; return; }
    $('#hud-gold').textContent = '💰 ' + G.state.player.gold;
  },

  /* 帮助弹窗 */
  helpModal() {
    const html =
      '<div class="help-sec"><b>▸ 冒险</b><br>阅读剧情，点击选项推进。<span class="k">🎲 属性检定</span>会掷 20 面骰：检定值 = 骰子 + 属性×2，达到 DC 即成功。力量/敏捷/智力/魅力各有用武之地。</div>' +
      '<div class="help-sec"><b>▸ 卡牌战斗</b><br>每回合获得 <span class="k">3 点行动力</span>，抽 5 张牌。点击卡牌打出：攻击敌方、获取护甲、施加状态。护甲只在本回合内有效。<br>敌人头顶会展示<b>意图</b>（⚔️攻击 / 🛡️防御 / ⬆️强化 / ☠️诅咒），据此制定策略。<br><span class="k">中毒</span>每回合扣血递减 · <span class="k">虚弱</span>输出 ×0.75 · <span class="k">易伤</span>受伤 ×1.5 · <span class="k">力量</span>每次攻击 +N 伤。</div>' +
      '<div class="help-sec"><b>▸ 成长</b><br>战斗胜利获得金币、经验，并从 3 张卡牌中挑选 1 张加入牌组。装备提供永久加成，药水可随时使用。</div>' +
      '<div class="help-sec"><b>▸ 遗物</b><br><span class="k">⚱️ 星尘遗物</span>是被动生效的稀有物件，无需装备，整局持续有效。商店有售，更多藏在精英战的战利品与隐秘角落——战斗界面的底栏也会亮出你携带的遗物。</div>' +
      '<div class="help-sec"><b>▸ 冒险图鉴</b><br><span class="k">📖 冒险图鉴</span>跨周目收录你获得过的卡牌、持有过的遗物与击败过的敌人。标题画面、菜单或牌组弹窗的"查看全图鉴"均可查阅；未收录的条目以 ？？？ 显示。</div>' +
      '<div class="help-sec"><b>▸ 快捷键</b><br>战斗中按 <span class="k">1~9</span> 选牌，<span class="k">E</span> 结束回合。剧情点击文字可跳过打字机动画。</div>' +
      '<div class="help-sec"><b>▸ 属性与笔记</b><br>点击左侧面板的属性可查看用途说明。<span class="k">📓 冒险笔记</span>（角色面板下方或菜单）自动记录任务进度与听来的情报线索——迷题的答案往往就藏在笔记里。</div>' +
      '<div class="help-sec" style="color:var(--dim)">游戏会在每个场景自动存档（浏览器本地）。战败可从检查点复活。</div>';
    UI.modal('操作说明', html);
  },
};
