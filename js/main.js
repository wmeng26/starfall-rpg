'use strict';
/* ============================================================
   星坠之谜 — 入口 / 标题 / 菜单 / 死亡
   ============================================================ */

const Main = {

  init() {
    /* 音效偏好 */
    try {
      const pref = localStorage.getItem(SOUND_KEY);
      if (pref === 'off') Sfx.enabled = false;
    } catch (e) {}
    this.renderSoundBtn();

    /* 顶栏 */
    $('#btn-sound').onclick = () => {
      Sfx.enabled = !Sfx.enabled;
      try { localStorage.setItem(SOUND_KEY, Sfx.enabled ? 'on' : 'off'); } catch (e) {}
      this.renderSoundBtn();
      Sfx.play('click');
    };
    $('#btn-menu').onclick = () => this.menuModal();
    $('#btn-panel').onclick = () => this.togglePanel();

    /* 拉宽窗口（如手机横屏超宽/桌面）时收回抽屉，避免面板残留遮挡 */
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) this.togglePanel(false);
    });

    this.showTitle();
  },

  renderSoundBtn() {
    $('#btn-sound').textContent = Sfx.enabled ? '🔊' : '🔇';
  },

  /* ============ 标题 ============ */
  showTitle() {
    G.state = null;
    Combat.abandon();
    UI.showView('title');
    UI.renderHud();
    UI.renderChar();
    $('#btn-panel').disabled = true;
    this.togglePanel(false);
    $('#scene-text').innerHTML = '';
    $('#choices').innerHTML = '';
    $('#log').innerHTML = '';

    const hasSave = Save.has();
    const view = $('#view-title');
    view.innerHTML =
      '<div class="title-star">✦</div>' +
      '<div class="title-name">星坠之谜</div>' +
      '<div class="title-sub">文 字 卡 牌 R P G</div>' +
      '<div class="title-menu">' +
      '<button class="title-btn" id="t-continue"' + (hasSave ? '' : ' disabled') + '>继 续 冒 险</button>' +
      '<button class="title-btn" id="t-new">新 的 冒 险</button>' +
      '<button class="title-btn" id="t-achv">🏆 成 就 图 鉴（' + Achieve.count() + '/' + Object.keys(DATA.ACHIEVEMENTS).length + '）</button>' +
      '<button class="title-btn" id="t-help">操 作 说 明</button>' +
      (hasSave ? '<button class="ghost-btn" id="t-del">删除存档</button>' : '') +
      '</div>' +
      '<div class="title-foot">雾隐镇 · 迷雾矿坑 · 守塔人的古塔</div>';

    $('#t-new').onclick = () => {
      Sfx.play('click');
      G.state = null;
      Story.goto('intro');
    };
    const cont = $('#t-continue');
    if (cont) cont.onclick = () => { Sfx.play('click'); this.loadSave('读取存档'); };
    $('#t-help').onclick = () => { Sfx.play('click'); UI.helpModal(); };
    $('#t-achv').onclick = () => { Sfx.play('click'); UI.achieveModal(); };
    const del = $('#t-del');
    if (del) del.onclick = () => {
      Save.clear();
      UI.toast('存档已删除', 'good');
      this.showTitle();
    };
  },

  /* ============ 读档（含自愈提示） ============ */
  loadSave(tag) {
    const st = Save.read();
    if (!st) { UI.toast('存档读取失败', 'bad'); return false; }
    if (!DATA.CLASSES[st.player.cls]) {
      UI.toast('存档职业已失效，无法继续', 'bad');
      return false;
    }
    G.state = st;
    UI.log('✦ ' + tag + '：' + DATA.CLASSES[st.player.cls].name + ' Lv.' + st.player.level, 'sys');
    if (st.repaired && st.repaired.length) {
      st.repaired.forEach((msg) => UI.log('🛠 存档自愈：已移除失效的 ' + msg, 'sys'));
      UI.toast('🛠 存档已修复 ' + st.repaired.length + ' 处失效内容', 'bad');
    }
    Story.goto(st.scene);
    return true;
  },

  /* ============ 移动端角色面板抽屉 ============ */
  togglePanel(open) {
    if (open === undefined) open = !document.body.classList.contains('panel-open');
    if (!open) {
      document.body.classList.remove('panel-open');
      const m = $('#panel-mask');
      if (m) m.remove();
      return;
    }
    if (!G.state) return; /* 标题画面不展开 */
    document.body.classList.add('panel-open');
    if (!$('#panel-mask')) {
      const mask = document.createElement('div');
      mask.id = 'panel-mask';
      mask.onclick = () => this.togglePanel(false);
      document.body.appendChild(mask);
    }
  },

  /* ============ 菜单 ============ */
  menuModal() {
    Sfx.play('click');
    const inGame = !!G.state;
    const html =
      '<div style="display:flex;flex-direction:column;gap:10px;align-items:stretch">' +
      '<button class="title-btn" id="m-help" style="font-size:15px;padding:10px">操作说明</button>' +
      (inGame
        ? '<button class="title-btn" id="m-journal" style="font-size:15px;padding:10px">📓 冒险笔记</button>' +
          '<button class="title-btn" id="m-title" style="font-size:15px;padding:10px">保存并回到标题</button>' +
          '<button class="ghost-btn" id="m-del" style="color:var(--red);border-color:var(--red)">删除存档（游戏进行中慎用）</button>'
        : '<div class="cp-hint" style="text-align:center">当前未在游戏中</div>') +
      '</div>';
    const m = UI.modal('菜 单', html);
    const q = (sel) => m.mask.querySelector(sel);
    const h = q('#m-help');
    if (h) h.onclick = () => { m.close(); UI.helpModal(); };
    const jb = q('#m-journal');
    if (jb) jb.onclick = () => { m.close(); UI.journalModal(); };
    const t = q('#m-title');
    if (t) t.onclick = () => { m.close(); this.showTitle(); };
    const d = q('#m-del');
    if (d) d.onclick = () => {
      Save.clear();
      UI.toast('存档已删除', 'good');
      m.close();
      this.showTitle();
    };
  },

  /* ============ 死亡 ============ */
  showDeath() {
    UI.showView('death');
    const view = $('#view-death');
    const hasSave = Save.has();
    view.innerHTML =
      '<div class="death-skull">💀</div>' +
      '<div class="death-title">你 倒 下 了</div>' +
      '<div class="death-sub">雾隐镇的风铃，为你响了一整夜。</div>' +
      '<div class="title-menu">' +
      (hasSave ? '<button class="title-btn" id="d-retry">从检查点复活</button>' : '') +
      '<button class="title-btn" id="d-title">回 到 标 题</button>' +
      '</div>';
    const retry = $('#d-retry');
    if (retry) retry.onclick = () => {
      Sfx.play('click');
      if (!this.loadSave('从检查点复活')) this.showTitle();
    };
    $('#d-title').onclick = () => this.showTitle();
  },
};

/* ============ 快捷键 ============ */
document.addEventListener('keydown', (e) => {
  if ($('#view-combat').hidden) return;
  if (e.key >= '1' && e.key <= '9') Combat.hotkey(parseInt(e.key, 10));
  else if (e.key === 'e' || e.key === 'E') Combat.endTurn();
});

/* ============ 启动 ============ */
window.addEventListener('DOMContentLoaded', () => {
  Main.init();
});
