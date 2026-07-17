/* ============================================================
   share.js — Formula URL Sharing via Hash Fragment
   编码公式到 URL hash，支持复制分享链接和页面加载恢复
   ============================================================ */

const ShareManager = {
  /** 复制分享链接到剪贴板 */
  copyShareLink() {
    const ta = document.getElementById('latexInput');
    if (!ta || !ta.value.trim()) {
      this._flashMsg('⚠ 暂无公式可分享');
      return;
    }
    const encoded = btoa(unescape(encodeURIComponent(ta.value)));
    const url = window.location.origin + window.location.pathname + '#' + encoded;

    try {
      navigator.clipboard.writeText(url).then(() => {
        this._flashMsg('✓ 分享链接已复制！');
      }).catch(() => {
        // fallback
        const tmp = document.createElement('textarea');
        tmp.value = url;
        tmp.style.position = 'fixed'; tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        this._flashMsg('✓ 分享链接已复制！');
      });
    } catch (e) {
      this._flashMsg('⚠ 复制失败，请手动复制地址栏');
    }
  },

  /** 页面加载时检查 hash，恢复公式 */
  restoreFromHash() {
    if (!window.location.hash || window.location.hash === '#') return false;
    try {
      const encoded = window.location.hash.substring(1);
      const decoded = decodeURIComponent(escape(atob(encoded)));
      const ta = document.getElementById('latexInput');
      if (ta && decoded.trim()) {
        ta.value = decoded;
        return true;
      }
    } catch (e) {
      // hash 无效，静默忽略
    }
    return false;
  },

  /** 更新 hash（不刷新页面） */
  updateHash() {
    const ta = document.getElementById('latexInput');
    if (!ta || !ta.value.trim()) {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname);
      }
      return;
    }
    const encoded = btoa(unescape(encodeURIComponent(ta.value)));
    const newHash = '#' + encoded;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  },

  /** 闪烁状态消息（复用 info strip） */
  _flashMsg(msg) {
    const info = document.getElementById('infoStrip');
    if (!info) return;
    const orig = info.innerHTML;
    info.innerHTML = '<strong style="color:var(--accent)">' + msg + '</strong>';
    setTimeout(() => { info.innerHTML = orig; }, 2000);
  }
};
