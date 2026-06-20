/* ============================================================
   ui.js — UI Event Bindings, Presets, and Widget Behaviors
   ============================================================ */

const UIBindings = {

  init() {
    this.bindBackgroundToggles();
    this.bindSliders();
    this.bindColorPickers();
    this.bindPresets();
    this.bindExportButtons();
    this.bindFontUI();
    this.bindMacroUI();
    this.bindPreprocessorUI();
    this.bindCollapsibles();
    this.bindLatexInput();
  },

  // ── Background toggles ──
  bindBackgroundToggles() {
    const customBgRow = document.getElementById('customBgRow');
    const bgColor = document.getElementById('bgColor');
    const previewWrap = document.getElementById('previewWrap');
    const previewInner = document.getElementById('previewInner');

    document.querySelectorAll('.bg-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        App.currentBg = btn.dataset.bg;
        customBgRow.style.display = App.currentBg === 'custom' ? 'flex' : 'none';
        this.applyBackground(previewWrap, previewInner, bgColor);
      });
    });

    bgColor.addEventListener('input', () => {
      this.applyBackground(previewWrap, previewInner, bgColor);
    });

    // Initial
    this.applyBackground(previewWrap, previewInner, bgColor);
  },

  applyBackground(wrap, inner, bgColorEl) {
    wrap.className = 'preview-wrap';
    if (App.currentBg === 'transparent') {
      wrap.classList.add('transparent-bg');
      inner.style.background = 'transparent';
    } else if (App.currentBg === 'white') {
      inner.style.background = '#ffffff';
      wrap.style.background = '#fff';
    } else if (App.currentBg === 'black') {
      inner.style.background = '#000000';
      wrap.style.background = '#000';
    } else {
      inner.style.background = bgColorEl.value;
      wrap.style.background = bgColorEl.value;
    }
  },

  // ── Sliders ──
  bindSliders() {
    const fontSizeEl = document.getElementById('fontSize');
    const paddingEl = document.getElementById('padding');
    const fontSizeVal = document.getElementById('fontSizeVal');
    const paddingVal = document.getElementById('paddingVal');

    fontSizeEl.addEventListener('input', () => {
      fontSizeVal.textContent = fontSizeEl.value + 'px';
      Renderer.scheduleRender();
    });
    paddingEl.addEventListener('input', () => {
      paddingVal.textContent = paddingEl.value + 'px';
      Renderer.scheduleRender();
    });
  },

  // ── Color picker ──
  bindColorPickers() {
    document.getElementById('formulaColor').addEventListener('input', () => Renderer.scheduleRender());
  },

  // ── LaTeX formula presets ──
  bindPresets() {
    const latexInput = document.getElementById('latexInput');
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.latex) {
          latexInput.value = btn.dataset.latex;
        }
        Renderer.scheduleRender();
      });
    });
  },

  // ── LaTeX input textarea ──
  bindLatexInput() {
    document.getElementById('latexInput').addEventListener('input', () => Renderer.scheduleRender());
  },

  // ── Export buttons ──
  bindExportButtons() {
    const exportFormat = document.getElementById('exportFormat');
    document.getElementById('exportBtn').addEventListener('click', () => {
      if (exportFormat.value === 'svg') Exporter.exportSVG();
      else Exporter.exportPNG();
    });
    document.getElementById('copyBtn').addEventListener('click', () => Exporter.copySVG());
  },

  // ════════════════════════════════════════════════════════
  // Module 1: Font UI
  // ════════════════════════════════════════════════════════
  bindFontUI() {
    const fontSelect = document.getElementById('fontSelect');
    const fontWeightSelect = document.getElementById('fontWeightSelect');
    const fontStyleSelect = document.getElementById('fontStyleSelect');
    const googleFontInput = document.getElementById('googleFontInput');
    const googleFontBtn = document.getElementById('googleFontBtn');
    const urlFontInput = document.getElementById('urlFontInput');
    const urlFontNameInput = document.getElementById('urlFontNameInput');
    const urlFontBtn = document.getElementById('urlFontBtn');
    const dropZone = document.getElementById('fontDropZone');
    const fontStatus = document.getElementById('fontStatus');

    // Populate dropdown
    this.refreshFontDropdown();

    // Font selection change
    fontSelect.addEventListener('change', () => {
      const w = parseInt(fontWeightSelect.value) || 400;
      const s = fontStyleSelect.value || 'normal';
      App.fontManager.applyFont(fontSelect.value, w, s);
    });

    fontWeightSelect.addEventListener('change', () => {
      const w = parseInt(fontWeightSelect.value) || 400;
      const s = fontStyleSelect.value || 'normal';
      App.fontManager.applyFont(fontSelect.value, w, s);
    });

    fontStyleSelect.addEventListener('change', () => {
      const w = parseInt(fontWeightSelect.value) || 400;
      const s = fontStyleSelect.value || 'normal';
      App.fontManager.applyFont(fontSelect.value, w, s);
    });

    // Google Font import
    googleFontBtn.addEventListener('click', () => {
      const name = googleFontInput.value.trim();
      if (!name) { fontStatus.textContent = '请输入字体名称'; fontStatus.className = 'error'; return; }
      try {
        App.fontManager.loadGoogleFont(name);
        this.refreshFontDropdown();
        fontSelect.value = name;
        App.fontManager.applyFont(name);
        fontStatus.textContent = `✓ 已加载 Google Font: ${name}`;
        fontStatus.className = '';
      } catch (e) {
        fontStatus.textContent = '加载失败：' + e.message;
        fontStatus.className = 'error';
      }
    });

    // URL font import
    urlFontBtn.addEventListener('click', () => {
      const name = urlFontNameInput.value.trim() || urlFontInput.value.split('/').pop().replace(/\.[^.]+$/, '');
      const url = urlFontInput.value.trim();
      if (!url) { fontStatus.textContent = '请输入字体文件 URL'; fontStatus.className = 'error'; return; }
      try {
        App.fontManager.loadFontFromURL(name, url);
        this.refreshFontDropdown();
        fontSelect.value = name;
        App.fontManager.applyFont(name);
        fontStatus.textContent = `✓ 已加载字体: ${name}`;
        fontStatus.className = '';
      } catch (e) {
        fontStatus.textContent = '加载失败：' + e.message;
        fontStatus.className = 'error';
      }
    });

    // Drag & drop font file upload
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      for (const file of files) {
        if (/\.(woff2?|ttf|otf)$/i.test(file.name)) {
          try {
            const fontName = await App.fontManager.loadFontFromFile(file);
            this.refreshFontDropdown();
            fontSelect.value = fontName;
            App.fontManager.applyFont(fontName);
            fontStatus.textContent = `✓ 已导入字体: ${fontName}`;
            fontStatus.className = '';
          } catch (err) {
            fontStatus.textContent = '导入失败：' + err.message;
            fontStatus.className = 'error';
          }
        } else {
          fontStatus.textContent = '不支持的文件格式，请上传 .woff2 / .ttf / .otf';
          fontStatus.className = 'error';
        }
      }
    });
    dropZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.woff2,.woff,.ttf,.otf';
      input.onchange = async () => {
        const files = input.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
          try {
            const fontName = await App.fontManager.loadFontFromFile(file);
            this.refreshFontDropdown();
            fontSelect.value = fontName;
            App.fontManager.applyFont(fontName);
            fontStatus.textContent = `✓ 已导入字体: ${fontName}`;
            fontStatus.className = '';
          } catch (err) {
            fontStatus.textContent = '导入失败：' + err.message;
            fontStatus.className = 'error';
          }
        }
      };
      input.click();
    });
  },

  refreshFontDropdown() {
    const fontSelect = document.getElementById('fontSelect');
    if (!fontSelect) return;
    const fonts = App.fontManager.getAvailableFonts();
    fontSelect.innerHTML = fonts.map(f =>
      `<option value="${f}" ${f === App.currentFont ? 'selected' : ''}>${f}</option>`
    ).join('');
  },

  // ════════════════════════════════════════════════════════
  // Module 3: Macro UI
  // ════════════════════════════════════════════════════════
  bindMacroUI() {
    const macroNameInput = document.getElementById('macroNameInput');
    const macroDefInput = document.getElementById('macroDefInput');
    const macroArgInput = document.getElementById('macroArgInput');
    const macroAddBtn = document.getElementById('macroAddBtn');
    const macroTags = document.getElementById('macroTags');
    const macroExportBtn = document.getElementById('macroExportBtn');
    const macroImportBtn = document.getElementById('macroImportBtn');
    const macroClearBtn = document.getElementById('macroClearBtn');

    // Add macro
    macroAddBtn.addEventListener('click', () => {
      const name = macroNameInput.value.trim();
      const def = macroDefInput.value.trim();
      const argCount = parseInt(macroArgInput.value) || 0;
      if (!name || !def) return;
      const result = App.macroManager.addMacro(name, def, argCount);
      if (!result.ok && result.warning) {
        if (!confirm(result.warning + '\n\n确定要继续吗？')) return;
        // Force add
        const cleanName = name.replace(/^\\/, '');
        App.macroManager.macros.set(cleanName, { definition: def, argCount });
        App.macroManager.injectToMathJax();
      }
      this.refreshMacroTags();
      macroNameInput.value = '';
      macroDefInput.value = '';
      macroArgInput.value = '0';
      Renderer.scheduleRender();
    });

    // Preset macro buttons
    document.querySelectorAll('.macro-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        macroNameInput.value = btn.dataset.name || '';
        macroDefInput.value = btn.dataset.def || '';
        macroArgInput.value = btn.dataset.args || '0';
      });
    });

    // Export macros
    macroExportBtn.addEventListener('click', () => {
      const json = App.macroManager.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = 'latex-macros.json';
      link.href = URL.createObjectURL(blob);
      link.click();
    });

    // Import macros
    macroImportBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const count = App.macroManager.importFromJSON(e.target.result);
          this.refreshMacroTags();
          Renderer.scheduleRender();
          alert(`已导入 ${count} 个宏定义`);
        };
        reader.readAsText(file);
      };
      input.click();
    });

    // Clear all macros
    macroClearBtn.addEventListener('click', () => {
      if (confirm('确定要清除所有自定义宏吗？')) {
        App.macroManager.clearAll();
        this.refreshMacroTags();
        Renderer.scheduleRender();
      }
    });

    // Click on tag to edit
    macroTags.addEventListener('click', (e) => {
      const tag = e.target.closest('.macro-tag');
      if (!tag) return;
      if (e.target.classList.contains('macro-delete')) {
        // Delete
        const name = tag.dataset.name;
        App.macroManager.removeMacro(name);
        this.refreshMacroTags();
        Renderer.scheduleRender();
      } else {
        // Edit: populate inputs
        const name = tag.dataset.name;
        const macro = App.macroManager.macros.get(name);
        if (macro) {
          macroNameInput.value = name;
          macroDefInput.value = macro.definition;
          macroArgInput.value = macro.argCount;
        }
      }
    });
  },

  refreshMacroTags() {
    const macroTags = document.getElementById('macroTags');
    if (!macroTags) return;
    const all = App.macroManager.getAll();
    macroTags.innerHTML = all.map(m =>
      `<span class="macro-tag" data-name="${m.name}" title="点击编辑 | × 删除">
        <span class="macro-name">\\${m.name}</span>
        ${m.argCount > 0 ? `<span style="font-size:0.6rem">[${m.argCount}参]</span>` : ''}
        <span class="macro-delete">&times;</span>
      </span>`
    ).join('') || '<span style="color:var(--muted);font-size:0.7rem;">暂无自定义宏</span>';
  },

  // ════════════════════════════════════════════════════════
  // Module 4: Preprocessor UI
  // ════════════════════════════════════════════════════════
  bindPreprocessorUI() {
    const scriptToggle = document.getElementById('scriptToggle');
    if (!scriptToggle) return;

    scriptToggle.addEventListener('change', () => {
      App.scriptMode = scriptToggle.checked;
      Renderer.scheduleRender();
    });

    // Preprocessor demo presets
    document.querySelectorAll('.pp-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('latexInput').value = btn.dataset.code || '';
        Renderer.scheduleRender();
      });
    });
  },

  // ════════════════════════════════════════════════════════
  // Collapsible sections
  // ════════════════════════════════════════════════════════
  bindCollapsibles() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        const body = header.nextElementSibling;
        if (body) body.classList.toggle('hidden');
      });
    });
  }
};
