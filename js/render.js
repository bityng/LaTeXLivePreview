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

    // ── Run preprocessor if script mode is active ──
    if (App.scriptMode && App.preprocessor) {
      try {
        rawLatex = App.preprocessor.process(rawLatex);
      } catch (e) {
        errorMsg.textContent = '预处理错误：' + e.message;
        errorMsg.style.display = 'block';
        return;
      }
    }

    // ── Inject macros into MathJax ──
    if (App.macroManager) {
      App.macroManager.injectToMathJax();
    }

    const color = formulaColor.value;
    const size = fontSizeEl.value;
    const pad = paddingEl.value;

    previewInner.style.padding = pad + 'px';

    try {
      formulaRender.innerHTML = '';

      // Use MathJax to generate SVG with macros injected
      const svg = await MathJax.tex2svgPromise(rawLatex, { display: true });
      const svgEl = svg.querySelector('svg');
      if (!svgEl) throw new Error('渲染失败');

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

  /** Update the info strip at the bottom of the preview panel */
  updateInfoStrip() {
    const infoStrip = document.getElementById('infoStrip');
    if (!infoStrip) return;
    let parts = [];
    parts.push(`字体：${App.currentFont} (${App.currentFontWeight}${App.currentFontStyle === 'italic' ? '/italic' : ''})`);
    if (App.scriptMode) parts.push('脚本模式：ON');
    if (App.macroManager && App.macroManager.macros.size > 0) {
      parts.push(`自定义宏：${App.macroManager.macros.size} 个`);
    }
    parts.push('导出：PNG（含透明背景）/ SVG');
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
