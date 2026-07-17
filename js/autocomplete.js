/* ============================================================
   autocomplete.js — LaTeX Command Autocomplete
   输入 \ 时弹出匹配命令列表，支持键盘导航和点击选择
   ============================================================ */

const AutoComplete = {
  /** 是否在下拉框可见状态 */
  visible: false,
  /** 当前高亮索引 */
  _index: 0,
  /** 匹配的命令列表 */
  _matches: [],
  /** 下拉框开始位置（textarea selectionStart 中的 \ 位置） */
  _startPos: 0,
  /** DOM 引用 */
  _dropdown: null,
  _overlay: null,

  /** 所有可补全的命令（精简常用命令 + LaTeXRef 数据） */
  _commands: [],

  init() {
    this._buildCommandList();
    this._createDropdown();
    this._bindEvents();
  },

  /** 构建命令列表：去重 + 按优先级排序 */
  _buildCommandList() {
    const seen = new Set();
    const cmds = [];

    // 从 LaTeXRef 分类数据中提取
    if (typeof LaTeXRef !== 'undefined' && LaTeXRef.categories) {
      Object.values(LaTeXRef.categories).forEach(items => {
        items.forEach(item => {
          const cmd = item.cmd.replace(/\\/g, '');
          // 提取核心命令名（去掉参数部分）：\frac{a}{b} → frac
          const core = cmd.split('{')[0].split('[')[0].trim();
          if (core && !seen.has(core) && core.length >= 2) {
            seen.add(core);
            cmds.push({ cmd: core, desc: item.desc, full: item.cmd });
          }
        });
      });
    }

    // 补充常用但可能不在 ref 中的命令
    const extras = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
      'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
      'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
      'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Omega',
      'frac', 'sqrt', 'sum', 'prod', 'int', 'lim', 'infty', 'partial',
      'mathbb', 'mathbf', 'mathcal', 'mathfrak', 'mathit', 'mathrm',
      'left', 'right', 'cdot', 'times', 'div', 'pm', 'mp', 'circ',
      'leq', 'geq', 'neq', 'approx', 'equiv', 'sim', 'propto',
      'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min',
      'vec', 'hat', 'tilde', 'bar', 'dot', 'ddot', 'overline',
      'begin', 'end', 'text', 'textcolor', 'color', 'displaystyle',
      'binom', 'choose', 'bmod', 'pmod', 'not', 'forall', 'exists',
      'to', 'mapsto', 'rightarrow', 'Rightarrow', 'leftarrow', 'Leftarrow',
      'subseteq', 'supseteq', 'cup', 'cap', 'setminus', 'oplus', 'otimes',
      'langle', 'rangle', 'lfloor', 'rfloor', 'lceil', 'rceil',
      'varnothing', 'emptyset', 'nabla', 'hbar', 'ell', 'wp', 'Re', 'Im',
    ];
    extras.forEach(cmd => {
      if (!seen.has(cmd)) {
        seen.add(cmd);
        cmds.push({ cmd, desc: cmd, full: '\\' + cmd });
      }
    });

    this._commands = cmds;
  },

  _createDropdown() {
    // 遮罩层（点击关闭）
    const overlay = document.createElement('div');
    overlay.className = 'ac-overlay';
    overlay.addEventListener('click', () => this.hide());
    document.body.appendChild(overlay);

    // 下拉框
    const dd = document.createElement('div');
    dd.className = 'ac-dropdown';
    document.body.appendChild(dd);

    this._overlay = overlay;
    this._dropdown = dd;
  },

  _bindEvents() {
    const ta = document.getElementById('latexInput');
    if (!ta) return;

    // 输入事件：检测 \ 触发补全
    ta.addEventListener('input', () => {
      if (this.visible) this._filterAndShow();
    });

    ta.addEventListener('keydown', (e) => {
      if (!this.visible) {
        // 检测反斜杠输入
        if (e.key === '\\' || e.key === 'Backslash') {
          setTimeout(() => this._onBackslash(), 0);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this._index = Math.min(this._index + 1, this._matches.length - 1);
          this._updateHighlight();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._index = Math.max(this._index - 1, 0);
          this._updateHighlight();
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (this._matches[this._index]) this._select(this._matches[this._index]);
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
        case 'Backspace':
          setTimeout(() => {
            if (this.visible) this._filterAndShow();
          }, 0);
          break;
      }
    });

    // 点击外部或滚动时关闭
    ta.addEventListener('blur', () => setTimeout(() => this.hide(), 150));
    ta.addEventListener('scroll', () => { if (this.visible) this._updatePosition(); });
  },

  /** 检测到 \ 输入后弹出补全 */
  _onBackslash() {
    const ta = document.getElementById('latexInput');
    if (!ta) return;
    const pos = ta.selectionStart;
    const text = ta.value;

    // 找到光标前最近的 \ 位置
    const before = text.substring(0, pos);
    const lastBS = before.lastIndexOf('\\');
    if (lastBS === -1) return;

    // 检查 \ 后面是否已有内容（光标在 \ 之后）
    const afterBS = before.substring(lastBS + 1);
    // 只匹配字母（命令名部分）
    const prefixMatch = afterBS.match(/^[a-zA-Z]*$/);
    if (prefixMatch === null) return;

    this._startPos = lastBS;
    this._filterAndShow();
  },

  _filterAndShow() {
    const ta = document.getElementById('latexInput');
    if (!ta) return;
    const pos = ta.selectionStart;
    const text = ta.value;

    // 获取当前输入的前缀
    const prefix = text.substring(this._startPos + 1, pos);

    // 过滤匹配
    this._matches = this._commands
      .filter(c => c.cmd.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort((a, b) => {
        // 精确匹配优先
        const aExact = a.cmd === prefix;
        const bExact = b.cmd === prefix;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        // 短命令优先
        return a.cmd.length - b.cmd.length;
      })
      .slice(0, 12);

    if (this._matches.length === 0) {
      this.hide();
      return;
    }

    this._index = 0;
    this._renderList();
    this._updatePosition();
    this._overlay.style.display = 'block';
    this._dropdown.style.display = 'block';
    this.visible = true;
  },

  _renderList() {
    this._dropdown.innerHTML = this._matches.map((m, i) =>
      `<div class="ac-item ${i === 0 ? 'active' : ''}" data-idx="${i}">
        <span class="ac-cmd">\\${m.cmd}</span>
        <span class="ac-desc">${m.desc.length > 40 ? m.desc.substring(0, 40) + '…' : m.desc}</span>
      </div>`
    ).join('');

    // 点击事件
    this._dropdown.querySelectorAll('.ac-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const idx = parseInt(el.dataset.idx);
        if (this._matches[idx]) this._select(this._matches[idx]);
      });
    });
  },

  _updateHighlight() {
    this._dropdown.querySelectorAll('.ac-item').forEach((el, i) => {
      el.classList.toggle('active', i === this._index);
    });
    // 滚动到可见
    const active = this._dropdown.querySelector('.ac-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  },

  _updatePosition() {
    const ta = document.getElementById('latexInput');
    if (!ta) return;

    // 用 mirror 计算光标像素位置
    const pos = this._startPos + 1; // \ 后面的位置
    const div = this._mirror || this._createMirror();
    this._mirror = div;

    const text = ta.value;
    div.textContent = text.substring(0, pos);

    // 获取 textarea 的坐标
    const taRect = ta.getBoundingClientRect();
    const scrollTop = ta.scrollTop;
    const scrollLeft = ta.scrollLeft;
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 24;
    const charWidth = 10; // JetBrains Mono 估算宽度

    const lines = text.substring(0, pos).split('\n');
    const lastLine = lines[lines.length - 1];
    const col = lastLine.length;

    const top = taRect.top + (lines.length - 1) * lineHeight + lineHeight + 4 - scrollTop;
    const left = taRect.left + col * charWidth - scrollLeft + 16; // +16 for padding

    this._dropdown.style.top = Math.min(top, window.innerHeight - 220) + 'px';
    this._dropdown.style.left = Math.min(left, window.innerWidth - 280) + 'px';
  },

  _createMirror() {
    const div = document.createElement('div');
    const ta = document.getElementById('latexInput');
    const style = getComputedStyle(ta);
    div.style.cssText = `
      position:absolute;visibility:hidden;white-space:pre-wrap;word-wrap:break-word;
      font-family:${style.fontFamily};font-size:${style.fontSize};
      line-height:${style.lineHeight};padding:${style.padding};overflow:hidden;
    `;
    div.style.width = ta.clientWidth + 'px';
    document.body.appendChild(div);
    return div;
  },

  /** 选中命令并插入 */
  _select(match) {
    const ta = document.getElementById('latexInput');
    if (!ta) return;

    const prefix = ta.value.substring(this._startPos + 1, ta.selectionStart);
    const cmdName = match.cmd;
    const replaceLen = 1 + prefix.length; // \ + prefix

    // 替换 \prefix 为 \cmdName
    const before = ta.value.substring(0, this._startPos);
    const after = ta.value.substring(ta.selectionStart);
    ta.value = before + '\\' + cmdName + ' ' + after;
    ta.selectionStart = ta.selectionEnd = this._startPos + cmdName.length + 1;
    ta.focus();

    this.hide();
    if (typeof SyntaxHighlight !== 'undefined') SyntaxHighlight.update();
    if (typeof Renderer !== 'undefined') Renderer.scheduleRender();
  },

  hide() {
    this.visible = false;
    this._matches = [];
    if (this._overlay) this._overlay.style.display = 'none';
    if (this._dropdown) this._dropdown.style.display = 'none';
  }
};
