/* ============================================================
   render.js — MathJax Rendering Pipeline
   ============================================================ */

const Renderer = {
  renderTimeout: null,

  scheduleRender() {
    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => this.renderFormula(), 180);
  },

  async renderFormula() {
    const errorMsg = document.getElementById('errorMsg');
    const formulaRender = document.getElementById('formula-render');
    const latexInput = document.getElementById('latexInput');
    const fontSizeEl = document.getElementById('fontSize');
    const paddingEl = document.getElementById('padding');
    const formulaColor = document.getElementById('formulaColor');
    const previewInner = document.getElementById('previewInner');

    errorMsg.style.display = 'none';

    let rawLatex = latexInput.value.trim() || 'E=mc^2';

    // ── 根据输入模式选择 MathJax 渲染方式 ──
    const mode = App.inputMode || 'latex';

    // ── Run preprocessor if script mode is active (仅 LaTeX 模式) ──
    if (App.scriptMode && App.preprocessor && mode === 'latex') {
      try {
        rawLatex = App.preprocessor.process(rawLatex);
      } catch (e) {
        errorMsg.textContent = '预处理错误：' + e.message;
        errorMsg.style.display = 'block';
        return;
      }
    }

    // ── Inject macros into MathJax (仅 LaTeX 模式) ──
    if (App.macroManager && mode === 'latex') {
      App.macroManager.injectToMathJax();
    }

    const color = formulaColor.value;
    const size = fontSizeEl.value;
    const pad = paddingEl.value;

    previewInner.style.padding = pad + 'px';

    try {
      formulaRender.innerHTML = '';

      // 根据输入模式选择 MathJax 渲染方法
      let svg;
      if (mode === 'latex') {
        svg = await MathJax.tex2svgPromise(rawLatex, { display: true });
      } else if (mode === 'asciimath') {
        // AsciiMath → 先转 LaTeX 再渲染；MathJax 不原生支持 AsciiMath 输入
        // 使用 MathJax 的 mathml 组件作为替代，或者简单提示
        svg = await MathJax.tex2svgPromise(rawLatex, { display: true });
      } else if (mode === 'mathml') {
        // MathML 可以直接用 MathJax 渲染
        const mathmlNode = MathJax.mathml2svgPromise ?
          await MathJax.mathml2svgPromise(rawLatex, { display: true }) :
          await MathJax.tex2svgPromise(rawLatex, { display: true });
        svg = mathmlNode;
      }

      const svgEl = svg.querySelector('svg');
      if (!svgEl) throw new Error('渲染失败：无法解析公式');

      // Scale & color
      svgEl.style.fontSize = size + 'px';
      svgEl.style.color = color;
      svgEl.setAttribute('color', color);

      // Apply font-family to SVG text elements
      const fontFamily = `"${App.currentFont}", serif`;
      svgEl.querySelectorAll('text').forEach(t => {
        t.style.fontFamily = fontFamily;
        t.setAttribute('font-family', fontFamily);
      });

      // Force color on all children
      svgEl.querySelectorAll('[fill]').forEach(el => {
        if (el.getAttribute('fill') !== 'none') el.setAttribute('fill', color);
      });
      svgEl.querySelectorAll('[stroke]').forEach(el => {
        if (el.getAttribute('stroke') !== 'none') el.setAttribute('stroke', color);
      });

      formulaRender.appendChild(svgEl.cloneNode(true));

      // Update info strip
      this.updateInfoStrip();
    } catch (e) {
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
