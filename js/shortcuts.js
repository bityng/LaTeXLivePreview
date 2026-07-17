/* ============================================================
   shortcuts.js — Keyboard Shortcuts Help Panel
   按 ? 键弹出快捷键速查面板
   ============================================================ */

const ShortcutsPanel = {
  _overlay: null,
  _dialog: null,

  _list: [
    { key: 'Ctrl+S', desc: '导出图片（PNG/SVG）' },
    { key: 'Ctrl+Shift+C', desc: '复制 SVG 源码' },
    { key: 'Ctrl+Shift+L', desc: '复制 LaTeX 源码' },
    { key: 'Ctrl+Z', desc: '撤销编辑' },
    { key: 'Ctrl+Y / Ctrl+Shift+Z', desc: '重做编辑' },
    { key: 'Ctrl+Enter', desc: '切换全屏预览' },
    { key: 'Tab', desc: '插入 2 空格缩进' },
    { key: 'ESC', desc: '关闭弹窗 / 退出全屏' },
    { key: '?', desc: '打开此快捷键帮助' },
    { key: '\\ + 字母', desc: '输入 \\ 后触发命令自动补全' },
    { key: '↑↓ / Enter', desc: '自动补全列表中导航/选择' },
    { key: '🔍 点击预览', desc: '放大查看公式（滚轮缩放）' },
    { key: '🖱 拖拽分隔条', desc: '调整左右面板宽度' },
  ],

  init() {
    this._createDOM();
    document.addEventListener('keydown', (e) => {
      // 不在输入框内按 ? 才弹出（编辑器中 ? 是正常字符）
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const ta = document.activeElement;
        if (ta && (ta.tagName === 'INPUT' || ta.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this._overlay.classList.contains('active')) {
        this.close();
      }
    });
  },

  _createDOM() {
    // overlay
    this._overlay = document.createElement('div');
    this._overlay.className = 'sc-overlay';
    this._overlay.addEventListener('click', () => this.close());
    document.body.appendChild(this._overlay);

    // dialog
    this._dialog = document.createElement('div');
    this._dialog.className = 'sc-dialog';
    this._dialog.innerHTML = `
      <div class="sc-header">
        <h2>⌨ 快捷键速查</h2>
        <button class="btn btn-secondary btn-small" onclick="ShortcutsPanel.close()">关闭</button>
      </div>
      <div class="sc-body">
        ${this._list.map(s => `
          <div class="sc-row">
            <kbd>${s.key}</kbd>
            <span>${s.desc}</span>
          </div>
        `).join('')}
      </div>`;
    document.body.appendChild(this._dialog);
  },

  toggle() {
    this._overlay.classList.contains('active') ? this.close() : this.open();
  },

  open() {
    this._overlay.classList.add('active');
    this._dialog.classList.add('active');
  },

  close() {
    this._overlay.classList.remove('active');
    this._dialog.classList.remove('active');
  }
};
