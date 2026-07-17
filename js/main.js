/* ============================================================
   main.js — 全局应用状态 & 初始化入口
   职责：应用状态管理、模块初始化、localStorage 偏好加载、MathJax 等待
   ============================================================ */

const App = {
  // ── 用户偏好（优先从 localStorage 读取，Storage.loadAll 覆盖）──
  currentBg:        'transparent',  // transparent | white | black | custom
  customBgColor:    '#f5f0e8',
  currentFont:      'Latin Modern',
  currentFontWeight: 400,
  currentFontStyle:  'normal',
  inputMode:        'latex',        // latex | asciimath | mathml
  scriptMode:       false,          // 预处理器开关
  darkMode:         false,          // 深色模式
  history:          [],             // 最近 20 条公式历史

  // ── 子模块引用（init 时实例化）──
  fontManager:  null,
  macroManager: null,
  preprocessor: null,

  /**
   * 主初始化：加载偏好 → 创建模块 → 等待 MathJax → 渲染首屏
   */
  init() {
    // 1. 加载 localStorage 中保存的用户偏好
    Storage.loadAll();

    // 2. 尝试从 URL hash 恢复公式（优先级高于 localStorage）
    if (ShareManager.restoreFromHash()) {
      App._restoredFromHash = true;
    }

    // 3. 恢复 DOM 控件值
    Storage.restoreDOM();

    // 3. 实例化子模块
    this.fontManager  = new FontManager();
    this.macroManager = new MacroManager();
    this.preprocessor = new Preprocessor();

    // 4. 绑定所有 UI 事件（UIBindings 会触发各模块的 initUI）
    UIBindings.init();

    // 5. 等待 MathJax 就绪后渲染
    this._waitForMathJaxThenRender();
  },

  /**
   * 等待 MathJax 加载完成
   * 优先检测 MathJax.tex2svgPromise 是否可用，不可用则轮询等待
   */
  _waitForMathJaxThenRender() {
    let rendered = false;
    const doRender = () => {
      if (rendered) return;
      rendered = true;
      Renderer.applyFontCSS(this.currentFont, this.currentFontWeight, this.currentFontStyle);
      if (typeof SyntaxHighlight !== 'undefined') SyntaxHighlight.update();
      Renderer.renderFormula();
    };

    // 如果 MathJax 的渲染方法已可用（最快路径）
    if (window.MathJax && typeof MathJax.tex2svgPromise === 'function') {
      doRender();
      return;
    }

    // 等待 MathJax.startup.promise
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
      MathJax.startup.promise
        .then(() => { doRender(); })
        .catch(() => { this._pollForMathJax(doRender); });
      setTimeout(() => { if (!rendered) this._pollForMathJax(doRender); }, 8000);
    } else {
      this._pollForMathJax(doRender);
    }
  },

  /**
   * 轮询等待 MathJax.tex2svgPromise 可用
   * @param {Function} callback - MathJax 就绪后的回调
   */
  _pollForMathJax(callback) {
    let attempts = 0;
    const maxAttempts = 100; // 最多等待 10 秒
    const interval = setInterval(() => {
      attempts++;
      if (window.MathJax && typeof MathJax.tex2svgPromise === 'function') {
        clearInterval(interval);
        callback();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        // 超时：显示错误
        const errEl = document.getElementById('errorMsg');
        if (errEl) {
          errEl.textContent = 'MathJax 加载超时，请检查网络连接或刷新页面重试';
          errEl.style.display = 'block';
        }
      }
    }, 100);
  }
};

/**
 * 全局快捷方法：触发公式重新渲染
 * 供外部模块调用
 */
function scheduleRender() {
  Renderer.scheduleRender();
}

// ── DOM 就绪后启动 ──
document.addEventListener('DOMContentLoaded', () => App.init());

