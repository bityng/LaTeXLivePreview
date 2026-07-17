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
    AutoComplete.init();
    HistoryManager.initUI();
    if (App.fontManager)  App.fontManager.initUI();
    if (App.macroManager) App.macroManager.initUI();
    if (App.preprocessor) App.preprocessor.initUI();
    LaTeXRef.initUI();
    PanelResizer.init();
    UndoManager.init();
    ShortcutsPanel.init();
    this.bindDarkModeToggle();
    this.bindFullscreenPreview();
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

    // 新增：复制 LaTeX 源码 / HTML 代码
    const clb = document.getElementById('copyLatexBtn');
    const chb = document.getElementById('copyHTMLBtn');
    const slb = document.getElementById('shareLinkBtn');
    if (clb) clb.addEventListener('click', () => Exporter.copyLatex());
    if (chb) chb.addEventListener('click', () => Exporter.copyHTML());
    if (slb) slb.addEventListener('click', () => ShareManager.copyShareLink());
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
    // 恢复之前的模式选择
    ms.value = App.inputMode;
    ms.addEventListener('change', () => {
      App.inputMode = ms.value;
      Storage.saveAll();

      // B1: 模式切换时清空 MathJax 内部缓存，防止旧模式状态锁死新渲染
      if (window.MathJax && typeof MathJax.typesetClear === 'function') {
        MathJax.typesetClear();
      }

      // B2: 非 LaTeX 模式降级提示
      if (App.inputMode !== 'latex') {
        const em = document.getElementById('errorMsg');
        if (em) {
          em.textContent = '⚠ 当前仅完全支持 LaTeX 模式。AsciiMath/MathML 模式下将使用 LaTeX 引擎降级渲染，结果可能不符合预期。';
          em.style.display = 'block';
        }
      }

      SyntaxHighlight.update();
      Renderer.scheduleRender();
    });
  },

  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && !e.shiftKey && e.key === 's') { e.preventDefault(); const ef = document.getElementById('exportFormat'); if (ef && ef.value === 'svg') Exporter.exportSVG(); else Exporter.exportPNG(); }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); Exporter.copySVG(); }
      // Ctrl+Shift+L: 复制 LaTeX 源码
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) { e.preventDefault(); Exporter.copyLatex(); }
    });
  },

  // ════════════════════════════════════════════════════════
  // 深色模式切换
  // ════════════════════════════════════════════════════════
  bindDarkModeToggle() {
    const btn = document.getElementById('darkModeBtn');
    if (!btn) return;
    // 恢复之前的状态（包括按钮文字）
    if (App.darkMode) document.documentElement.classList.add('dark');
    btn.textContent = App.darkMode ? '☀' : '🌙';
    btn.addEventListener('click', () => {
      App.darkMode = !App.darkMode;
      document.documentElement.classList.toggle('dark', App.darkMode);
      btn.textContent = App.darkMode ? '☀' : '🌙';
      Storage.set('darkMode', App.darkMode);
    });
  },

  // ════════════════════════════════════════════════════════
  // 全屏纯净预览（隐藏左侧控制面板 + header）
  // ════════════════════════════════════════════════════════
  bindFullscreenPreview() {
    const btn = document.getElementById('fullscreenPreviewBtn');
    const exitBtn = document.getElementById('fullscreenExitBtn');
    if (!btn) return;

    const enterFullscreen = () => {
      document.body.classList.add('fullscreen-preview');
      btn.textContent = '📋 退出全屏';
    };
    const exitFullscreen = () => {
      document.body.classList.remove('fullscreen-preview');
      btn.textContent = '📺 全屏预览';
    };

    btn.addEventListener('click', () => {
      document.body.classList.contains('fullscreen-preview') ? exitFullscreen() : enterFullscreen();
    });

    // 浮动退出按钮
    if (exitBtn) {
      exitBtn.addEventListener('click', exitFullscreen);
    }

    // ESC 退出全屏预览
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('fullscreen-preview')) {
        exitFullscreen();
      }
    });
  }
};
