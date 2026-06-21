/* ============================================================
   syntax-highlight.js — LaTeX Syntax Highlight in Editor
   Uses transparent-textarea + highlighted-pre overlay technique
   ============================================================ */

const SyntaxHighlight = {

  init() {
    this.highlightEl = document.getElementById('editorHighlight');
    this.textareaEl = document.getElementById('latexInput');
    if (!this.highlightEl || !this.textareaEl) return;

    this.textareaEl.addEventListener('input', () => this.update());
    this.textareaEl.addEventListener('scroll', () => this.syncScroll());
    this.textareaEl.addEventListener('keydown', (e) => this._handleTab(e));

    // Initial highlight
    this.update();
  },

  update() {
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
