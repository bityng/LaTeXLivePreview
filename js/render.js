/* ============================================================
   render.js — MathJax Rendering Pipeline
   特性：300ms 防抖 | 渲染竞态保护 | 快照二次校验 | 超时保护
   ============================================================ */

const Renderer = {
  /** setTimeout ID，用于防抖 */
  renderTimeout: null,
  /** 递增的渲染批次 ID，用于竞态检测 */
  _renderId: 0,
  /** 用于取消正在进行的 MathJax Promise */
  _aborted: false,
  /** 最近一次渲染耗时 (ms) */
  lastRenderTime: 0,
  /** 历史推送防抖定时器 */
  _historyPushTimeout: null,

  /**
   * 调度渲染（300ms 防抖）
   * 每次输入事件调用此方法，300ms 无后续输入才真正执行渲染
   */
  scheduleRender() {
    clearTimeout(this.renderTimeout);
    this._aborted = true; // 取消上一次未完成的渲染
    this.renderTimeout = setTimeout(() => this.renderFormula(), 300);
  },

  /**
   * 执行渲染（async，带竞态保护）
   */
  async renderFormula() {
    this._aborted = false;
    const renderId = ++this._renderId;
    const t0 = performance.now();               // ⏱ 计时开始
    const errorMsg = document.getElementById('errorMsg');
    const formulaRender = document.getElementById('formula-render');
    const latexInput = document.getElementById('latexInput');
    const fontSizeEl  = document.getElementById('fontSize');
    const paddingEl   = document.getElementById('padding');
    const formulaColor = document.getElementById('formulaColor');
    const previewInner = document.getElementById('previewInner');

    errorMsg.style.display = 'none';

    // ═══ A4: 快照 —— 记录本次渲染的输入文本 ═══
    const snapshot = latexInput.value;
    let rawLatex = snapshot.trim() || 'E=mc^2';

    // ── 输入模式 ──
    const mode = App.inputMode || 'latex';

    // ── 预处理器（仅 LaTeX 模式 + 脚本开关开启）──
    if (App.scriptMode && App.preprocessor && mode === 'latex') {
      try {
        rawLatex = App.preprocessor.process(rawLatex);
      } catch (e) {
        if (this._aborted || renderId !== this._renderId) return;
        errorMsg.textContent = '预处理错误：' + e.message;
        errorMsg.style.display = 'block';
        return;
      }
    }

    // ── 注入自定义宏（仅 LaTeX 模式）──
    if (App.macroManager && mode === 'latex') {
      App.macroManager.injectToMathJax();
    }

    const color = formulaColor.value;
    const size  = fontSizeEl.value;
    const pad   = paddingEl.value;

    previewInner.style.padding = pad + 'px';

    try {
      formulaRender.innerHTML = '';

      // ═══ 根据输入模式选择 MathJax 渲染方法（带 8 秒超时保护）═══
      let svgDoc;
      const renderPromise = (mode === 'latex' || mode === 'asciimath' || mode === 'mathml')
        ? MathJax.tex2svgPromise(rawLatex, { display: true })
        : MathJax.tex2svgPromise(rawLatex, { display: true });

      // E1: 8 秒超时保护 —— 如果 MathJax 长时间无响应，自动中断
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MathJax 渲染超时（>8秒），请检查网络连接或刷新页面')), 8000)
      );
      svgDoc = await Promise.race([renderPromise, timeoutPromise]);

      // ═══ A2: 竞态检查 —— 渲染过程中是否有新输入 ═══
      if (this._aborted || renderId !== this._renderId) return;

      const svgEl = svgDoc.querySelector('svg');
      if (!svgEl) throw new Error('渲染失败：无法解析公式');

      // ═══ A4: 二次快照校验 —— 渲染完成后检查输入是否已变更 ═══
      if (latexInput.value !== snapshot) return;

      // 缩放 & 颜色
      svgEl.style.fontSize = size + 'px';
      svgEl.style.color = color;
      svgEl.setAttribute('color', color);

      // 应用字体
      const fontFamily = `"${App.currentFont}", serif`;
      svgEl.querySelectorAll('text').forEach(t => {
        t.style.fontFamily = fontFamily;
        t.setAttribute('font-family', fontFamily);
      });

      // 强制颜色到所有 fill/stroke 属性（排除 fill="none" 的路径）
      svgEl.querySelectorAll('[fill]').forEach(el => {
        if (el.getAttribute('fill') !== 'none') el.setAttribute('fill', color);
      });
      svgEl.querySelectorAll('[stroke]').forEach(el => {
        if (el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', color);
      });

      // 直接 append
      formulaRender.appendChild(svgEl);

      // ⏱ 记录渲染耗时
      this.lastRenderTime = Math.round(performance.now() - t0);

      // 📜 历史推送（渲染成功 1.5 秒后自动保存，避免频繁写入）
      clearTimeout(this._historyPushTimeout);
      this._historyPushTimeout = setTimeout(() => {
        HistoryManager.push(snapshot);
      }, 1500);

      // 更新信息条
      this.updateInfoStrip();

    } catch (e) {
      // ═══ A2: 如果已被取消，不显示错误 ═══
      if (this._aborted || renderId !== this._renderId) return;
      errorMsg.textContent = '公式解析错误：' + e.message;
      errorMsg.style.display = 'block';
    }
  },

  /** Get the currently rendered SVG element with color applied */
  getStyledSVG() {
    const formulaRender = document.getElementById('formula-render');
    const formulaColor = document.getElementById('formulaColor');
    const svgEl = formulaRender.querySelector('svg');
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true);
    const color = formulaColor.value;
    clone.querySelectorAll('[fill]').forEach(el => {
      if (el.getAttribute('fill') !== 'none') el.setAttribute('fill', color);
    });
    clone.querySelectorAll('[stroke]').forEach(el => {
      if (el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', color);
    });
    const fontFamily = `"${App.currentFont}", serif`;
    clone.querySelectorAll('text').forEach(t => {
      t.style.fontFamily = fontFamily;
      t.setAttribute('font-family', fontFamily);
    });
    return clone;
  },

  /** 更新预览面板底部的信息条 */
  updateInfoStrip() {
    const infoStrip = document.getElementById('infoStrip');
    if (!infoStrip) return;
    let parts = [];
    const modeNames = { latex: 'LaTeX', asciimath: 'AsciiMath', mathml: 'MathML' };
    parts.push(`模式：${modeNames[App.inputMode] || 'LaTeX'}`);
    parts.push(`字体：${App.currentFont} (${App.currentFontWeight}${App.currentFontStyle === 'italic' ? '/italic' : ''})`);
    if (App.scriptMode) parts.push('脚本：ON');
    if (App.macroManager && App.macroManager.macros.size > 0) {
      parts.push(`宏：${App.macroManager.macros.size} 个`);
    }
    parts.push('Ctrl+S 导出 | Ctrl+Shift+C 复制');
    if (this.lastRenderTime > 0) parts.push(`渲染耗时: ${this.lastRenderTime}ms`);
    infoStrip.innerHTML = parts.map(p => `<strong>●</strong> ${p}`).join(' &nbsp;|&nbsp; ');
  },

  /** Dynamically create @font-face and apply to MathJax output */
  applyFontCSS(fontName, weight = 400, style = 'normal') {
    // Remove previous font style
    const old = document.getElementById('dynamic-font-style');
    if (old) old.remove();

    // If a Google Font is loaded, no extra @font-face needed
    // For custom fonts managed by FontManager, it already injects its own @font-face
    // Just apply font-family to the formula render container
    const formulaRender = document.getElementById('formula-render');
    if (formulaRender) {
      formulaRender.style.fontFamily = `"${fontName}", serif`;
    }
  }
};
