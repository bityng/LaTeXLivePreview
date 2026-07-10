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
      this.highlightEl.innerHTML = html + '\n';
      this.syncScroll();
    } catch (e) {
      // 语法高亮崩溃不应影响公式渲染——静默降级为纯文本显示
      this.highlightEl.textContent = this.textareaEl.value;
      console.warn('[SyntaxHighlight] 高亮失败，降级为纯文本', e);
    }
  },

  syncScroll() {
    this.highlightEl.scrollTop = this.textareaEl.scrollTop;
    this.highlightEl.scrollLeft = this.textareaEl.scrollLeft;
  },

  _highlight(text) {
    // Escape HTML first
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments: % to end of line
    escaped = escaped.replace(/(%.*)/g, '<span class="hl-cmt">$1</span>');

    // Commands: \word or \word{...} — but be careful not to double-highlight
    escaped = escaped.replace(/(\\(?:[a-zA-Z]+|.))/g, (match) => {
      // Skip if already inside a span
      if (match.includes('<span')) return match;
      return '<span class="hl-cmd">' + match + '</span>';
    });

    // Braces { } — highlight with muted color
    // Only apply to braces not already in spans
    escaped = escaped.replace(/(?<!<span[^>]*>)([\{\}])(?!<\/span>)/g, '<span class="hl-brace">$1</span>');

    // Math symbols ^ _
    escaped = escaped.replace(/(?<!<span[^>]*>)([\^_])(?!<\/span>)/g, '<span class="hl-sym">$1</span>');

    // Fix nested spans that may have been created: remove empty
    escaped = escaped.replace(/<span[^>]*><\/span>/g, '');

    return escaped;
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

  /** Insert text at cursor position and update highlight */
  insertAtCursor(text) {
    const ta = this.textareaEl;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + text + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
    this.update();
    Renderer.scheduleRender();
  },

  /** Wrap selected text or insert template */
  wrapOrInsert(before, after = '') {
    const ta = this.textareaEl;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const insertion = selected ? before + selected + after : before + after;
    ta.value = ta.value.substring(0, start) + insertion + ta.value.substring(end);
    const newPos = selected ? start + insertion.length : start + before.length;
    ta.selectionStart = ta.selectionEnd = newPos;
    ta.focus();
    this.update();
    Renderer.scheduleRender();
  }
};
