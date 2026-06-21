/* ============================================================
   history.js — 公式历史记录（撤销/重做）
   管理最多 20 条历史，支持 Ctrl+Z / Ctrl+Y
   ============================================================ */

const History = {
  MAX_SIZE: 20,

  /** 添加一条记录到历史 */
  push(latex) {
    if (!latex || latex.trim() === '') return;
    // 如果和上一条相同则跳过
    if (App.history.length > 0 && App.history[App.history.length - 1] === latex) return;
    App.history.push(latex);
    if (App.history.length > this.MAX_SIZE) App.history.shift();
  },

  /** 弹出最近一条（用于撤销后恢复） */
  pop() {
    return App.history.pop();
  },

  /** 获取最后一条 */
  last() {
    return App.history.length > 0 ? App.history[App.history.length - 1] : null;
  },

  /** 获取倒数第 n 条 */
  nthFromEnd(n) {
    const idx = App.history.length - 1 - n;
    return idx >= 0 ? App.history[idx] : null;
  },

  /** 清空历史 */
  clear() {
    App.history = [];
  }
};
