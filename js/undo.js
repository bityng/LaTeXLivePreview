/* ============================================================
   undo.js — Undo/Redo Manager for Textarea
   Ctrl+Z 撤销 / Ctrl+Y 或 Ctrl+Shift+Z 重做，30 步历史
   ============================================================ */

const UndoManager = {
  MAX: 30,
  _stack: [],
  _index: -1,
  _saving: false,
  _coalesceTimer: null,

  init() {
    const ta = document.getElementById('latexInput');
    if (!ta) return;

    // 记录初始状态
    this._push(ta.value);

    ta.addEventListener('input', () => {
      if (this._saving) return;
      // 合并 500ms 内的输入为一组
      clearTimeout(this._coalesceTimer);
      this._coalesceTimer = setTimeout(() => this._push(ta.value), 500);
    });

    ta.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        this.redo();
      }
    });
  },

  _push(value) {
    // 去重：与栈顶相同则跳过
    if (this._stack[this._index] === value) return;

    // 清除 redo（当前 index 之后的部分）
    this._stack = this._stack.slice(0, this._index + 1);
    this._stack.push(value);

    // 限制栈大小
    if (this._stack.length > this.MAX) {
      this._stack.shift();
    } else {
      this._index++;
    }
  },

  undo() {
    if (this._index <= 0) return;
    this._index--;
    this._apply(this._stack[this._index]);
  },

  redo() {
    if (this._index >= this._stack.length - 1) return;
    this._index++;
    this._apply(this._stack[this._index]);
  },

  _apply(value) {
    const ta = document.getElementById('latexInput');
    if (!ta) return;
    this._saving = true;
    ta.value = value;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    this._saving = false;
  }
};
