/* ============================================================
   syntax-highlight.js — LaTeX 编辑器语法高亮
   使用透明 textarea + 高亮 pre 叠加方案，rAF 节流防止高频重绘
   ============================================================ */

const SyntaxHighlight = {

  /** rAF ID 用于节流，避免每次 input 都重绘 */
  _rafId: null,
  /** 是否已有待执行的 update（防重复） */
  _pending: false,

  init() {
    this.highlightEl = document.getElementById('editorHighlight');
    this.textareaEl = document.getElementById('latexInput');
    if (!this.highlightEl || !this.textareaEl) return;

    // input 事件使用 rAF 节流更新高亮
    this.textareaEl.addEventListener('input', () => this._scheduleUpdate());
    this.textareaEl.addEventListener('scroll', () => this.syncScroll());
    this.textareaEl.addEventListener('keydown', (e) => this._handleTab(e));

    this._executeUpdate();
  },

  /** 调度高亮更新（rAF 节流） */
  _scheduleUpdate() {
    if (this._pending) return;           // 已有待执行
    this._pending = true;
    this._rafId = requestAnimationFrame(() => {
      this._pending = false;
      this._executeUpdate();
    });
  },

  /** 立即更新高亮（供外部 insertAtCursor/wrapOrInsert 调用） */
  update() {
    cancelAnimationFrame(this._rafId);
    this._pending = false;
    this._executeUpdate();
  },

  /** 实际执行高亮渲染 */
  _executeUpdate() {
    try {
      const text = this.textareaEl.value;
      const html = this._highlight(text);
      // 用 innerHTML 写入高亮后的内容
      this.highlightEl.innerHTML = html;
      this.syncScroll();
    } catch (e) {
      // 高亮失败时清空 pre（textarea 依然可见，不受影响）
      this.highlightEl.textContent = '';
    }
  },

  syncScroll() {
    this.highlightEl.scrollTop = this.textareaEl.scrollTop;
    this.highlightEl.scrollLeft = this.textareaEl.scrollLeft;
  },

  /**
   * 核心高亮函数：将 LaTeX 源码转为带颜色 span 的 HTML
   * 注意：只转义 HTML 关键字符，不转义 &（避免破坏 LaTeX 命令）
   */
  _highlight(text) {
    // 用 textContent 安全赋值来获取纯文本（textarea.value 本身就是纯文本）
    let out = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 注释：% 到行尾 → 绿色斜体
    out = out.replace(/(%.*)/g, '<span class="hl-cmt">$1</span>');

    // LaTeX 命令：\ 后跟字母串或单个非字母字符
    // 先标记已处理的 span 区域，防止后续替换破坏
    out = out.replace(/(\\(?:[a-zA-Z]+|[^a-zA-Z\s]))/g, (match) => {
      if (match.includes('&lt;span')) return match;
      return '<span class="hl-cmd">' + match + '</span>';
    });

    // 花括号 { }：灰色
    out = out.replace(/([\{\}])/g, (match, p1, offset, str) => {
      // 简易检测：如果前面最近的 < 是 span 开头而非 span 闭合，说明已在 span 内
      const before = str.substring(Math.max(0, offset - 60), offset);
      const openCount = (before.match(/<span/gi) || []).length;
      const closeCount = (before.match(/<\/span>/gi) || []).length;
      if (openCount > closeCount) return match; // 已在 span 内
      return '<span class="hl-brace">' + match + '</span>';
    });

    // 数学符号 ^ _
    out = out.replace(/([\^_])/g, (match, p1, offset, str) => {
      const before = str.substring(Math.max(0, offset - 60), offset);
      const openCount = (before.match(/<span/gi) || []).length;
      const closeCount = (before.match(/<\/span>/gi) || []).length;
      if (openCount > closeCount) return match;
      return '<span class="hl-sym">' + match + '</span>';
    });

    return out;
  },

  _handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = this.textareaEl;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 2;
      this.update();
    }
  },

  /** 向光标处插入文本并更新高亮 */
  insertAtCursor(text) {
    const ta = this.textareaEl;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + text + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
    this.update();
    if (typeof Renderer !== 'undefined') Renderer.scheduleRender();
  },

  /** 包裹选中文本或插入模板 */
  wrapOrInsert(before, after = '') {
    const ta = this.textareaEl;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const insertion = selected ? before + selected + after : before + after;
    ta.value = ta.value.substring(0, start) + insertion + ta.value.substring(end);
    const newPos = selected ? start + insertion.length : start + before.length;
    ta.selectionStart = ta.selectionEnd = newPos;
    ta.focus();
    this.update();
    if (typeof Renderer !== 'undefined') Renderer.scheduleRender();
  }
};
