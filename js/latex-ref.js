/* ============================================================
   latex-ref.js — LaTeX Syntax Reference Table
   ============================================================ */

const LaTeXRef = {
  categories: {
    '希腊字母': [
      { cmd: '\\alpha', desc: 'α' },
      { cmd: '\\beta', desc: 'β' },
      { cmd: '\\gamma', desc: 'γ' },
      { cmd: '\\delta', desc: 'δ' },
      { cmd: '\\epsilon', desc: 'ε' },
      { cmd: '\\varepsilon', desc: 'ε' },
      { cmd: '\\zeta', desc: 'ζ' },
      { cmd: '\\eta', desc: 'η' },
      { cmd: '\\theta', desc: 'θ' },
      { cmd: '\\vartheta', desc: 'ϑ' },
      { cmd: '\\iota', desc: 'ι' },
      { cmd: '\\kappa', desc: 'κ' },
      { cmd: '\\lambda', desc: 'λ' },
      { cmd: '\\mu', desc: 'μ' },
      { cmd: '\\nu', desc: 'ν' },
      { cmd: '\\xi', desc: 'ξ' },
      { cmd: '\\pi', desc: 'π' },
      { cmd: '\\varpi', desc: 'ϖ' },
      { cmd: '\\rho', desc: 'ρ' },
      { cmd: '\\varrho', desc: 'ϱ' },
      { cmd: '\\sigma', desc: 'σ' },
      { cmd: '\\varsigma', desc: 'ς' },
      { cmd: '\\tau', desc: 'τ' },
      { cmd: '\\upsilon', desc: 'υ' },
      { cmd: '\\phi', desc: 'φ' },
      { cmd: '\\varphi', desc: 'ϕ' },
      { cmd: '\\chi', desc: 'χ' },
      { cmd: '\\psi', desc: 'ψ' },
      { cmd: '\\omega', desc: 'ω' },
      { cmd: '\\Gamma', desc: 'Γ' },
      { cmd: '\\Delta', desc: 'Δ' },
      { cmd: '\\Theta', desc: 'Θ' },
      { cmd: '\\Lambda', desc: 'Λ' },
      { cmd: '\\Xi', desc: 'Ξ' },
      { cmd: '\\Pi', desc: 'Π' },
      { cmd: '\\Sigma', desc: 'Σ' },
      { cmd: '\\Upsilon', desc: 'Υ' },
      { cmd: '\\Phi', desc: 'Φ' },
      { cmd: '\\Psi', desc: 'Ψ' },
      { cmd: '\\Omega', desc: 'Ω' },
    ],
    '数学符号': [
      { cmd: '\\infty', desc: '∞' },
      { cmd: '\\partial', desc: '∂' },
      { cmd: '\\nabla', desc: '∇' },
      { cmd: '\\forall', desc: '∀' },
      { cmd: '\\exists', desc: '∃' },
      { cmd: '\\neg', desc: '¬' },
      { cmd: '\\emptyset', desc: '∅' },
      { cmd: '\\varnothing', desc: '∅' },
      { cmd: '\\in', desc: '∈' },
      { cmd: '\\notin', desc: '∉' },
      { cmd: '\\subset', desc: '⊂' },
      { cmd: '\\subseteq', desc: '⊆' },
      { cmd: '\\supset', desc: '⊃' },
      { cmd: '\\supseteq', desc: '⊇' },
      { cmd: '\\cup', desc: '∪' },
      { cmd: '\\cap', desc: '∩' },
      { cmd: '\\setminus', desc: '∖' },
      { cmd: '\\cdot', desc: '·' },
      { cmd: '\\times', desc: '×' },
      { cmd: '\\div', desc: '÷' },
      { cmd: '\\pm', desc: '±' },
      { cmd: '\\mp', desc: '∓' },
      { cmd: '\\circ', desc: '∘' },
      { cmd: '\\bullet', desc: '•' },
      { cmd: '\\oplus', desc: '⊕' },
      { cmd: '\\ominus', desc: '⊖' },
      { cmd: '\\otimes', desc: '⊗' },
      { cmd: '\\oslash', desc: '⊘' },
      { cmd: '\\odot', desc: '⊙' },
      { cmd: '\\bigcirc', desc: '○' },
    ],
    '箭头': [
      { cmd: '\\to', desc: '→' },
      { cmd: '\\rightarrow', desc: '→' },
      { cmd: '\\leftarrow', desc: '←' },
      { cmd: '\\Rightarrow', desc: '⇒' },
      { cmd: '\\Leftarrow', desc: '⇐' },
      { cmd: '\\Leftrightarrow', desc: '⇔' },
      { cmd: '\\mapsto', desc: '↦' },
      { cmd: '\\uparrow', desc: '↑' },
      { cmd: '\\downarrow', desc: '↓' },
      { cmd: '\\updownarrow', desc: '↕' },
      { cmd: '\\nearrow', desc: '↗' },
      { cmd: '\\searrow', desc: '↘' },
      { cmd: '\\swarrow', desc: '↙' },
      { cmd: '\\nwarrow', desc: '↖' },
      { cmd: '\\longrightarrow', desc: '⟶' },
      { cmd: '\\longleftarrow', desc: '⟵' },
      { cmd: '\\Longrightarrow', desc: '⟹' },
      { cmd: '\\Longleftarrow', desc: '⟸' },
    ],
    '关系符': [
      { cmd: '\\leq', desc: '≤' },
      { cmd: '\\geq', desc: '≥' },
      { cmd: '\\neq', desc: '≠' },
      { cmd: '\\approx', desc: '≈' },
      { cmd: '\\equiv', desc: '≡' },
      { cmd: '\\sim', desc: '∼' },
      { cmd: '\\simeq', desc: '≃' },
      { cmd: '\\cong', desc: '≅' },
      { cmd: '\\propto', desc: '∝' },
      { cmd: '\\ll', desc: '≪' },
      { cmd: '\\gg', desc: '≫' },
      { cmd: '\\prec', desc: '≺' },
      { cmd: '\\succ', desc: '≻' },
      { cmd: '\\preceq', desc: '≼' },
      { cmd: '\\succeq', desc: '≽' },
      { cmd: '\\parallel', desc: '∥' },
      { cmd: '\\perp', desc: '⊥' },
      { cmd: '\\mid', desc: '|' },
    ],
    '函数/运算符': [
      { cmd: '\\frac{a}{b}', desc: '分数 a/b' },
      { cmd: '\\sqrt{x}', desc: '平方根' },
      { cmd: '\\sqrt[n]{x}', desc: 'n 次根' },
      { cmd: '\\sum', desc: '∑ 求和' },
      { cmd: '\\prod', desc: '∏ 连乘' },
      { cmd: '\\int', desc: '∫ 积分' },
      { cmd: '\\iint', desc: '∬ 二重积分' },
      { cmd: '\\iiint', desc: '∭ 三重积分' },
      { cmd: '\\oint', desc: '∮ 环路积分' },
      { cmd: '\\lim', desc: 'lim 极限' },
      { cmd: '\\log', desc: 'log' },
      { cmd: '\\ln', desc: 'ln' },
      { cmd: '\\sin', desc: 'sin' },
      { cmd: '\\cos', desc: 'cos' },
      { cmd: '\\tan', desc: 'tan' },
      { cmd: '\\arcsin', desc: 'arcsin' },
      { cmd: '\\arccos', desc: 'arccos' },
      { cmd: '\\arctan', desc: 'arctan' },
      { cmd: '\\sinh', desc: 'sinh' },
      { cmd: '\\cosh', desc: 'cosh' },
      { cmd: '\\tanh', desc: 'tanh' },
      { cmd: '\\det', desc: 'det' },
      { cmd: '\\dim', desc: 'dim' },
      { cmd: '\\gcd', desc: 'gcd' },
      { cmd: '\\sup', desc: 'sup' },
      { cmd: '\\inf', desc: 'inf' },
      { cmd: '\\max', desc: 'max' },
      { cmd: '\\min', desc: 'min' },
    ],
    '括号/定界符': [
      { cmd: '\\left( ... \\right)', desc: '自适应括号' },
      { cmd: '\\left[ ... \\right]', desc: '自适应方括号' },
      { cmd: '\\left\\{ ... \\right\\}', desc: '自适应花括号' },
      { cmd: '\\left| ... \\right|', desc: '自适应绝对值' },
      { cmd: '\\left\\| ... \\right\\|', desc: '自适应范数' },
      { cmd: '\\langle ... \\rangle', desc: '⟨…⟩ 尖括号' },
      { cmd: '\\lfloor ... \\rfloor', desc: '底函数' },
      { cmd: '\\lceil ... \\rceil', desc: '顶函数' },
      { cmd: '\\binom{n}{k}', desc: '二项式系数' },
      { cmd: '\\overbrace{x}', desc: '上括号' },
      { cmd: '\\underbrace{x}', desc: '下括号' },
    ],
    '矩阵': [
      { cmd: '\\begin{matrix} ... \\end{matrix}', desc: '矩阵(无括号)' },
      { cmd: '\\begin{pmatrix} ... \\end{pmatrix}', desc: '圆括号矩阵' },
      { cmd: '\\begin{bmatrix} ... \\end{bmatrix}', desc: '方括号矩阵' },
      { cmd: '\\begin{Bmatrix} ... \\end{Bmatrix}', desc: '花括号矩阵' },
      { cmd: '\\begin{vmatrix} ... \\end{vmatrix}', desc: '行列式' },
      { cmd: '\\begin{Vmatrix} ... \\end{Vmatrix}', desc: '范数矩阵' },
    ],
    '重音/装饰': [
      { cmd: '\\hat{x}', desc: 'x̂' },
      { cmd: '\\bar{x}', desc: 'x̄' },
      { cmd: '\\vec{x}', desc: 'x⃗' },
      { cmd: '\\dot{x}', desc: 'ẋ' },
      { cmd: '\\ddot{x}', desc: 'ẍ' },
      { cmd: '\\tilde{x}', desc: 'x̃' },
      { cmd: '\\widehat{abc}', desc: '宽帽' },
      { cmd: '\\widetilde{abc}', desc: '宽波浪' },
      { cmd: '\\overline{x}', desc: '上划线' },
      { cmd: '\\underline{x}', desc: '下划线' },
      { cmd: '\\overleftarrow{AB}', desc: '上左箭头' },
      { cmd: '\\overrightarrow{AB}', desc: '上右箭头' },
    ],
    '字体/样式': [
      { cmd: '\\mathbb{R}', desc: '黑板粗体 ℝ' },
      { cmd: '\\mathbf{x}', desc: '粗体' },
      { cmd: '\\mathcal{A}', desc: '书法体' },
      { cmd: '\\mathfrak{A}', desc: 'Fraktur' },
      { cmd: '\\mathit{x}', desc: '斜体' },
      { cmd: '\\mathrm{x}', desc: '正体' },
      { cmd: '\\mathsf{x}', desc: '无衬线体' },
      { cmd: '\\mathtt{x}', desc: '打字机体' },
      { cmd: '\\text{文字}', desc: '文本模式' },
      { cmd: '\\textcolor{red}{x}', desc: '红色文字' },
      { cmd: '\\colorbox{yellow}{x}', desc: '黄底文字' },
    ],
  },

  currentTab: '希腊字母',
  currentFilter: '',

  open() {
    const overlay = document.getElementById('refOverlay');
    overlay.classList.add('active');
    this.currentTab = '希腊字母';
    this.currentFilter = '';
    document.getElementById('refSearchInput').value = '';
    this.renderTabs();
    this.renderItems();
  },

  close() {
    document.getElementById('refOverlay').classList.remove('active');
  },

  renderTabs() {
    const tabs = document.getElementById('refTabs');
    tabs.innerHTML = Object.keys(this.categories).map(cat =>
      `<span class="ref-tab ${cat === this.currentTab ? 'active' : ''}" data-cat="${cat}">${cat}</span>`
    ).join('');
    tabs.querySelectorAll('.ref-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.cat;
        this.renderTabs();
        this.renderItems();
      });
    });
  },

  renderItems() {
    const body = document.getElementById('refBody');
    const items = this.categories[this.currentTab] || [];
    const f = this.currentFilter.toLowerCase();
    const filtered = f ? items.filter(i => i.cmd.toLowerCase().includes(f) || i.desc.toLowerCase().includes(f)) : items;

    if (filtered.length === 0) {
      body.innerHTML = '<div class="ref-empty">未找到匹配的符号</div>';
      return;
    }

    body.innerHTML = filtered.map(item =>
      `<div class="ref-item" data-cmd="${item.cmd.replace(/"/g, '&quot;')}">
        <span class="ref-cmd">${this._escapeHTML(item.cmd)}</span>
        <span class="ref-desc">${item.desc}</span>
      </div>`
    ).join('');

    body.querySelectorAll('.ref-item').forEach(el => {
      el.addEventListener('click', () => {
        this._insertCmd(el.dataset.cmd);
      });
    });
  },

  filter(val) {
    this.currentFilter = val;
    this.renderItems();
  },

  _insertCmd(cmd) {
    const ta = document.getElementById('latexInput');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    ta.value = text.substring(0, start) + cmd + text.substring(end);
    ta.selectionStart = ta.selectionEnd = start + cmd.length;
    ta.focus();
    Renderer.scheduleRender();
  },

  _escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * 初始化语法参考表的 UI 绑定（按钮、搜索、ESC 关闭）
   * 由 UIBindings.init() 调用
   */
  initUI() {
    // 打开按钮
    const refBtn = document.getElementById('refBtn');
    if (refBtn) {
      refBtn.addEventListener('click', () => this.open());
    }

    // 点击遮罩关闭
    const overlay = document.getElementById('refOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    // 搜索过滤
    const searchInput = document.getElementById('refSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filter(e.target.value);
      });
    }

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const refOverlay = document.getElementById('refOverlay');
        if (refOverlay && refOverlay.classList.contains('active')) {
          this.close();
        }
      }
    });
  }
};
