/* ============================================================
   history.js — 公式历史记录（UI 面板 + 存储 + 撤销/重做）
   管理最多 20 条历史，自动保存，点击回填，支持 Ctrl+Z/Y
   ============================================================ */

const HistoryManager = {
  MAX_SIZE: 20,

  /** 添加到历史（去重）*/
  push(latex) {
    if (!latex || latex.trim() === '') return;
    if (App.history.length > 0 && App.history[App.history.length - 1] === latex) return;
    App.history.push(latex);
    if (App.history.length > this.MAX_SIZE) App.history.shift();
    Storage.saveAll();     // 持久化
    this._renderUI();      // 刷新面板
  },

  /** 弹出最近一条 */
  pop() { const v = App.history.pop(); Storage.saveAll(); this._renderUI(); return v; },

  /** 清空历史 */
  clear() { App.history = []; Storage.saveAll(); this._renderUI(); },

  /**
   * 渲染历史记录面板 DOM
   * 由 push/clear/init 调用
   */
  _renderUI() {
    const listEl = document.getElementById('historyList');
    const countEl = document.getElementById('historyCount');
    if (!listEl) return;

    if (App.history.length === 0) {
      listEl.innerHTML = '<span style="color:var(--muted);font-size:0.65rem;">暂无历史记录，输入公式后将自动保存</span>';
      if (countEl) countEl.textContent = '0';
      return;
    }

    // 倒序显示（最新在上）
    const items = App.history.slice().reverse();
    listEl.innerHTML = items.map((latex, i) => {
      const origIdx = App.history.length - 1 - i;
      const preview = latex.replace(/&/g, '&amp;').replace(/\\/g, '\\\\').replace(/"/g, '&quot;').replace(/</g, '&lt;').substring(0, 60);
      return `<div class="history-item" data-idx="${origIdx}" title="点击恢复此公式">
        <span style="color:var(--muted);flex-shrink:0;font-size:0.55rem;">#${origIdx + 1}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;">${preview}${latex.length > 60 ? '…' : ''}</span>
        <span class="history-del" data-del="${origIdx}">&times;</span>
      </div>`;
    }).join('');

    if (countEl) countEl.textContent = App.history.length;

    // 点击事件：回填到编辑器
    listEl.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('history-del')) return; // 由删除处理
        const idx = parseInt(el.dataset.idx);
        const latex = App.history[idx];
        if (latex !== undefined) {
          const ta = document.getElementById('latexInput');
          if (ta) { ta.value = latex; ta.focus(); }
          SyntaxHighlight.update();
          Renderer.scheduleRender();
        }
      });
    });

    // 删除按钮
    listEl.querySelectorAll('.history-del').forEach(del => {
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(del.dataset.del);
        App.history.splice(idx, 1);
        Storage.saveAll();
        this._renderUI();
      });
    });
  },

  /**
   * 初始化历史面板 UI 绑定
   */
  initUI() {
    // 渲染现有历史
    this._renderUI();

    // 清空按钮
    const clrBtn = document.getElementById('historyClearBtn');
    if (clrBtn) {
      clrBtn.addEventListener('click', () => {
        if (confirm('确定要清空全部历史记录吗？')) this.clear();
      });
    }
  }
};
