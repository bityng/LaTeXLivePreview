/* ============================================================
   export.js — PNG / SVG Export & Clipboard
   ============================================================ */

const Exporter = {

  /** Export as PNG (supports transparent background) */
  async exportPNG() {
    const svgEl = Renderer.getStyledSVG();
    if (!svgEl) return alert('请先输入有效的公式');

    const paddingEl = document.getElementById('padding');
    const fontSizeEl = document.getElementById('fontSize');
    const pad = parseInt(paddingEl.value);

    // Get natural size from viewBox
    const vb = svgEl.getAttribute('viewBox');
    let w, h;
    if (vb) {
      const parts = vb.split(/\s+/);
      w = parseFloat(parts[2]);
      h = parseFloat(parts[3]);
    } else {
      w = parseFloat(svgEl.getAttribute('width') || 200);
      h = parseFloat(svgEl.getAttribute('height') || 80);
    }

    const scale = parseInt(fontSizeEl.value) / 16;
    const canvasW = Math.ceil(w * scale + pad * 2);
    const canvasH = Math.ceil(h * scale + pad * 2);

    const canvas = document.getElementById('exportCanvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    if (App.currentBg !== 'transparent') {
      ctx.fillStyle = App.currentBg === 'white' ? '#ffffff'
                    : App.currentBg === 'black' ? '#000000'
                    : document.getElementById('bgColor').value;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    svgEl.setAttribute('width', w * scale);
    svgEl.setAttribute('height', h * scale);
    const xml = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, pad, pad, w * scale, h * scale);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = 'formula.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  },

  /** Export as standalone SVG file */
  exportSVG() {
    const svgEl = Renderer.getStyledSVG();
    if (!svgEl) return alert('请先输入有效的公式');

    const paddingEl = document.getElementById('padding');
    const fontSizeEl = document.getElementById('fontSize');
    const pad = parseInt(paddingEl.value);
    const scale = parseInt(fontSizeEl.value) / 16;

    const vb = svgEl.getAttribute('viewBox');
    let w = 200, h = 80;
    if (vb) {
      const parts = vb.split(/\s+/);
      w = parseFloat(parts[2]);
      h = parseFloat(parts[3]);
    }
    const sw = w * scale, sh = h * scale;
    const totalW = sw + pad * 2, totalH = sh + pad * 2;

    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrapper.setAttribute('width', totalW);
    wrapper.setAttribute('height', totalH);
    wrapper.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

    if (App.currentBg !== 'transparent') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', totalW);
      rect.setAttribute('height', totalH);
      rect.setAttribute('fill', App.currentBg === 'white' ? '#ffffff'
                            : App.currentBg === 'black' ? '#000000'
                            : document.getElementById('bgColor').value);
      wrapper.appendChild(rect);
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${pad}, ${pad}) scale(${scale})`);
    svgEl.setAttribute('width', w);
    svgEl.setAttribute('height', h);
    g.appendChild(svgEl);
    wrapper.appendChild(g);

    const xml = new XMLSerializer().serializeToString(wrapper);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'formula.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
  },

  /** Copy SVG source to clipboard */
  async copySVG() {
    const svgEl = Renderer.getStyledSVG();
    if (!svgEl) {
      this._flashBtn('copyBtn', '⚠ 暂无公式可复制');
      return;
    }
    const xml = new XMLSerializer().serializeToString(svgEl);
    try {
      await navigator.clipboard.writeText(xml);
      this._flashBtn('copyBtn', '✓ 已复制！');
    } catch (e) {
      // 回退：非安全上下文或权限不足时使用 execCommand
      this._fallbackCopy(xml, 'copyBtn', '✓ 已复制！');
    }
  },

  /** Copy raw LaTeX source to clipboard */
  async copyLatex() {
    const ta = document.getElementById('latexInput');
    if (!ta || !ta.value.trim()) {
      this._flashBtn('copyLatexBtn', '⚠ 暂无内容可复制');
      return;
    }
    try {
      await navigator.clipboard.writeText(ta.value);
      this._flashBtn('copyLatexBtn', '✓ LaTeX 已复制！');
    } catch (e) {
      this._fallbackCopy(ta.value, 'copyLatexBtn', '✓ LaTeX 已复制！');
    }
  },

  /** Copy rendered formula as HTML code */
  async copyHTML() {
    const svgEl = Renderer.getStyledSVG();
    if (!svgEl) {
      this._flashBtn('copyHTMLBtn', '⚠ 暂无公式可复制');
      return;
    }
    const html = svgEl.outerHTML;
    try {
      await navigator.clipboard.writeText(html);
      this._flashBtn('copyHTMLBtn', '✓ HTML 已复制！');
    } catch (e) {
      this._fallbackCopy(html, 'copyHTMLBtn', '✓ HTML 已复制！');
    }
  },

  /** Fallback copy using execCommand for non-secure contexts */
  _fallbackCopy(text, btnId, successMsg) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this._flashBtn(btnId, successMsg);
    } catch (e2) {
      this._flashBtn(btnId, '⚠ 复制失败');
    }
  },

  /** Flash a button text temporarily */
  _flashBtn(btnId, text) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = text;
    setTimeout(() => btn.textContent = orig, 1600);
  }
};
