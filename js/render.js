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
  /** MathJax 不可用时的重试计数（最多 30 次 = 15 秒） */
  _retryCount: 0,

  /**
   * 调度渲染（300ms 防抖）
   * 每次输入事件调用此方法，300ms 无后续输入才真正执行渲染
   */
  scheduleRender() {
    clearTimeout(this.renderTimeout);
    this._aborted = true; // 取消上一次未完成的渲染
    this._retryCount = 0; // 重置重试计数
    this.renderTimeout = setTimeout(() => this.renderFormula(), 300);
  },

  /**
   * 执行渲染（async，带竞态保护）
   */
  async renderFormula() {
    // ── MathJax 可用性门禁 ──
    if (!window.MathJax || typeof MathJax.tex2svgPromise !== 'function') {
      this._retryCount++;
      if (this._retryCount > 30) {
        const errorMsg = document.getElementById('errorMsg');
        if (errorMsg) {
          errorMsg.textContent = '⚠ MathJax 引擎加载失败，请刷新页面重试';
          errorMsg.style.display = 'block';
        }
        return;
      }
      this.renderTimeout = setTimeout(() => this.renderFormula(), 500);
      return;
    }

    this._aborted = false;
    const renderId = ++this._renderId;
    const t0 = performance.now();
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
      // tex-svg 组件仅包含 TeX 输入处理器；AsciiMath/MathML 需额外组件
      let svgDoc;
      let renderPromise;

      if (mode === 'latex') {
        // LaTeX 模式：使用 tex2svgPromise（tex-svg 组件原生支持）
        renderPromise = MathJax.tex2svgPromise(rawLatex, { display: true });
      } else if (mode === 'asciimath') {
        // AsciiMath 模式：检查 asciimath2svgPromise 是否可用
        if (typeof MathJax.asciimath2svgPromise === 'function') {
          renderPromise = MathJax.asciimath2svgPromise(rawLatex, { display: true });
        } else {
          // 降级：使用 LaTeX 引擎渲染，并向用户提示
          renderPromise = MathJax.tex2svgPromise(rawLatex, { display: true });
        }
      } else if (mode === 'mathml') {
        // MathML 模式：检查 mathml2svgPromise 是否可用
        if (typeof MathJax.mathml2svgPromise === 'function') {
          renderPromise = MathJax.mathml2svgPromise(rawLatex, { display: true });
        } else {
          // 降级：尝试将 MathML 源码作为 LaTeX 处理
          renderPromise = MathJax.tex2svgPromise(rawLatex, { display: true });
        }
      } else {
        // 未知模式，默认 LaTeX
        renderPromise = MathJax.tex2svgPromise(rawLatex, { display: true });
      }

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
      // 仅设置根 SVG 的 color，MathJax 内部 use currentColor 会自动继承
      svgEl.style.fontSize = size + 'px';
      svgEl.style.color = color;
      svgEl.setAttribute('color', color);

      // 应用字体
      const fontFamily = `"${App.currentFont}", serif`;
      svgEl.querySelectorAll('text').forEach(t => {
        t.style.fontFamily = fontFamily;
        t.setAttribute('font-family', fontFamily);
      });

      // 颜色处理：仅修改 fill="currentColor" 的元素，保留 MathJax 内部彩色
      svgEl.querySelectorAll('[fill]').forEach(el => {
        const f = el.getAttribute('fill');
        if (f && f !== 'none' && f === 'currentColor') {
          el.setAttribute('fill', color);
        }
      });
      svgEl.querySelectorAll('[stroke]').forEach(el => {
        const s = el.getAttribute('stroke');
        if (s && s !== 'none' && s === 'currentColor') {
          el.setAttribute('stroke', color);
        }
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
      errorMsg.innerHTML = this._formatError(latexInput.value, e);
      errorMsg.style.display = 'block';
    }
  },

  /**
   * 格式化错误信息：友好中文 + 行号定位 + 修复建议
   * @param {string} source - 原始输入
   * @param {Error} error - MathJax 抛出的错误
   * @returns {string} HTML 格式的错误信息
   */
  _formatError(source, error) {
    const errMsg = error.message || '未知错误';
    const lines = source.split('\n');

    // 尝试从 MathJax 错误中提取位置信息
    // MathJax 3 错误消息格式示例: "TeX parse error: ..."
    const parseMatch = errMsg.match(/parse error[:\s]+(.*)/i);
    const detailedMsg = parseMatch ? parseMatch[1] : errMsg;

    // 构建友好提示
    let html = '<strong>⚠ 公式解析失败</strong><br>';
    html += '<span style="color:var(--muted)">原因：</span>' + this._escapeHTML(detailedMsg) + '<br>';

    // 常见错误类型 → 修复建议映射
    const suggestions = [];
    if (/Missing\s+\\right/i.test(errMsg) || /Missing\s+\\end/i.test(errMsg)) {
      suggestions.push('可能缺少配对的 \\right 或 \\end 命令');
    }
    if (/Undefined control sequence/i.test(errMsg)) {
      const cmdMatch = errMsg.match(/Undefined control sequence[:\s]+(\\.+)/i);
      if (cmdMatch) suggestions.push('命令 <code>' + this._escapeHTML(cmdMatch[1]) + '</code> 未定义，请检查拼写');
    }
    if (/Missing\s+\{/i.test(errMsg) || /Missing\s+\}/i.test(errMsg)) {
      suggestions.push('花括号 {} 不成对，检查是否遗漏');
    }
    if (/Extra\s+\}/i.test(errMsg)) {
      suggestions.push('多余的花括号 }，检查是否写多了');
    }
    if (/Missing\s+\$/i.test(errMsg)) {
      suggestions.push('数学模式 $ 符不成对');
    }
    if (/MathJax retry/i.test(errMsg)) {
      suggestions.push('公式过于复杂，尝试简化或分段输入');
    }
    if (suggestions.length === 0) {
      suggestions.push('检查 LaTeX 命令拼写是否正确');
      suggestions.push('确保所有花括号 {} 和括号 () 成对出现');
    }

    html += '<span style="color:var(--muted)">建议：</span>';
    html += suggestions.map(s => '• ' + s).join('<br>');

    // 显示行号（如果有多行）
    if (lines.length > 1) {
      html += '<br><span style="color:var(--muted);font-size:0.62rem;">共 ' + lines.length + ' 行</span>';
    }

    return html;
  },

  /** 转义 HTML 特殊字符 */
  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /** Get the currently rendered SVG element with color applied */
  getStyledSVG() {
    const formulaRender = document.getElementById('formula-render');
    const formulaColor = document.getElementById('formulaColor');
    const svgEl = formulaRender.querySelector('svg');
    if (!svgEl) return null;
    const clone = svgEl.cloneNode(true);
    const color = formulaColor.value;
    // 仅替换 fill="currentColor" 的元素，保留 MathJax 内部彩色
    clone.querySelectorAll('[fill]').forEach(el => {
      const f = el.getAttribute('fill');
      if (f && f !== 'none' && f === 'currentColor') {
        el.setAttribute('fill', color);
      }
    });
    clone.querySelectorAll('[stroke]').forEach(el => {
      const s = el.getAttribute('stroke');
      if (s && s !== 'none' && s === 'currentColor') {
        el.setAttribute('stroke', color);
      }
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

    // Inject font-family CSS rule into the SVG output + container
    // MathJax SVG uses <use> elements for math glyphs (unaffected by font-family),
    // but <text> elements for \text{} content DO respond to font-family
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-font-style';
    styleEl.textContent = [
      `#formula-render { font-family: "${fontName}", serif; }`,
      `#formula-render svg text { font-family: "${fontName}", serif; font-weight: ${weight}; font-style: ${style}; }`,
      `#formula-render svg { font-weight: ${weight}; font-style: ${style}; }`
    ].join('\n');
    document.head.appendChild(styleEl);

    // Also apply directly to the DOM for already-rendered SVG
    const formulaRender = document.getElementById('formula-render');
    if (formulaRender) {
      formulaRender.style.fontFamily = `"${fontName}", serif`;
      formulaRender.style.fontWeight = weight;
      formulaRender.style.fontStyle = style;
      // Update existing <text> elements in rendered SVG
      const fontFamily = `"${fontName}", serif`;
      formulaRender.querySelectorAll('svg text').forEach(t => {
        t.style.fontFamily = fontFamily;
        t.setAttribute('font-family', fontFamily);
      });
    }
  }
};
