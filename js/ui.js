/* ============================================================
   ui.js — 基础 UI 控件绑定
   负责：背景切换 / 滑块 / 颜色 / 预设 / 导出 / 折叠面板 / 快捷键
   模块专属 UI（字体/宏/预处理器等）由各自模块的 initUI() 负责
   ============================================================ */

const UIBindings = {

  init() {
    this.bindBackgroundToggles();
    this.bindSliders();
    this.bindColorPickers();
    this.bindPresets();
    this.bindExportButtons();
    this.bindCollapsibles();
    this.bindLatexInput();
    this.bindKeyboardShortcuts();
    this.bindInputModeSwitch();
    SyntaxHighlight.init();
    PreviewZoom.init();
    QuickEdit.init();
    if (App.fontManager)  App.fontManager.initUI();
    if (App.macroManager) App.macroManager.initUI();
    if (App.preprocessor) App.preprocessor.initUI();
    LaTeXRef.initUI();
  },

  bindBackgroundToggles() {
    const cr = document.getElementById('customBgRow');
    const bc = document.getElementById('bgColor');
    const pw = document.getElementById('previewWrap');
    const pi = document.getElementById('previewInner');
    document.querySelectorAll('.bg-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        App.currentBg = btn.dataset.bg;
        cr.style.display = App.currentBg === 'custom' ? 'flex' : 'none';
        this._applyBg(pw, pi, bc);
        Storage.saveAll();
      });
    });
    const ab = document.querySelector('.bg-opt[data-bg="' + App.currentBg + '"]');
    if (ab) { document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active')); ab.classList.add('active'); cr.style.display = App.currentBg === 'custom' ? 'flex' : 'none'; }
    bc.addEventListener('input', () => { this._applyBg(pw, pi, bc); Storage.saveFromDOM(); });
    this._applyBg(pw, pi, bc);
  },

  _applyBg(wrap, inner, bcEl) {
    wrap.className = 'preview-wrap';
    if (App.currentBg === 'transparent') { wrap.classList.add('transparent-bg'); inner.style.background = 'transparent'; }
    else if (App.currentBg === 'white') { inner.style.background = '#ffffff'; wrap.style.background = '#fff'; }
    else if (App.currentBg === 'black') { inner.style.background = '#000000'; wrap.style.background = '#000'; }
    else { const c = bcEl ? bcEl.value : App.customBgColor; inner.style.background = c; wrap.style.background = c; }
  },

  bindSliders() {
    const fe = document.getElementById('fontSize');
    const pe = document.getElementById('padding');
    const fv = document.getElementById('fontSizeVal');
    const pv = document.getElementById('paddingVal');
    fe.addEventListener('input', () => { fv.textContent = fe.value + 'px'; Renderer.scheduleRender(); Storage.saveFromDOM(); });
    pe.addEventListener('input', () => { pv.textContent = pe.value + 'px'; Renderer.scheduleRender(); Storage.saveFromDOM(); });
  },

  bindColorPickers() {
    document.getElementById('formulaColor').addEventListener('input', () => { Renderer.scheduleRender(); Storage.saveFromDOM(); });
  },

  bindPresets() {
    const li = document.getElementById('latexInput');
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.latex) li.value = btn.dataset.latex;
        if (btn.dataset.code) li.value = btn.dataset.code;
        SyntaxHighlight.update();
        Renderer.scheduleRender();
      });
    });
  },

  bindLatexInput() {
    const ta = document.getElementById('latexInput');
    ta.addEventListener('input', () => { SyntaxHighlight.update(); Renderer.scheduleRender(); });
    ta.addEventListener('scroll', () => SyntaxHighlight.syncScroll());
  },

  bindExportButtons() {
    const ef = document.getElementById('exportFormat');
    document.getElementById('exportBtn').addEventListener('click', () => {
      if (ef.value === 'svg') Exporter.exportSVG(); else Exporter.exportPNG();
    });
    document.getElementById('copyBtn').addEventListener('click', () => Exporter.copySVG());
    ef.addEventListener('change', () => Storage.saveFromDOM());
  },

  bindCollapsibles() {
    document.querySelectorAll('.collapsible-header').forEach(h => {
      h.addEventListener('click', () => {
        h.classList.toggle('collapsed');
        const b = h.nextElementSibling;
        if (b) b.classList.toggle('hidden');
      });
    });
  },

  bindInputModeSwitch() {
    const ms = document.getElementById('inputModeSelect');
    if (!ms) return;
    ms.addEventListener('change', () => { App.inputMode = ms.value; Storage.saveAll(); SyntaxHighlight.update(); Renderer.scheduleRender(); });
  },

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 's') { e.preventDefault(); const ef = document.getElementById('exportFormat'); if (ef && ef.value === 'svg') Exporter.exportSVG(); else Exporter.exportPNG(); }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); Exporter.copySVG(); }
    });
  }
};
