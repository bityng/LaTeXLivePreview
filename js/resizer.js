/* ============================================================
   resizer.js — Draggable Panel Resizer
   拖拽分隔条调整左右面板宽度，状态持久化到 localStorage
   ============================================================ */

const PanelResizer = {
  _dragging: false,
  _startX: 0,
  _startWidth: 460,

  init() {
    const handle = document.getElementById('panelResizer');
    if (!handle) return;

    // 恢复保存的宽度
    const saved = Storage.get('leftPanelWidth');
    if (saved && saved >= 300 && saved <= 800) {
      document.documentElement.style.setProperty('--left-width', saved + 'px');
    }

    handle.addEventListener('mousedown', (e) => {
      this._dragging = true;
      this._startX = e.clientX;
      const style = getComputedStyle(document.documentElement);
      this._startWidth = parseInt(style.getPropertyValue('--left-width').trim()) || 460;
      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this._dragging) return;
      const delta = e.clientX - this._startX;
      const newWidth = Math.max(300, Math.min(800, this._startWidth + delta));
      document.documentElement.style.setProperty('--left-width', newWidth + 'px');
    });

    document.addEventListener('mouseup', () => {
      if (!this._dragging) return;
      this._dragging = false;
      handle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // 持久化
      const style = getComputedStyle(document.documentElement);
      const w = parseInt(style.getPropertyValue('--left-width').trim()) || 460;
      Storage.set('leftPanelWidth', w);
    });
  }
};
