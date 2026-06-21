/* ============================================================
   storage.js — localStorage 偏好读写
   负责：字体/颜色/背景/大小等用户偏好的持久化存储
   ============================================================ */

const Storage = {
  /** 存储键名前缀，避免与其他站点冲突 */
  KEY: 'latex_live_',

  /** 默认偏好值 */
  DEFAULTS: {
    currentBg: 'transparent',
    customBgColor: '#f5f0e8',
    formulaColor: '#1a1a2e',
    fontSize: 36,
    padding: 24,
    exportFormat: 'png',
    currentFont: 'Latin Modern',
    currentFontWeight: 400,
    currentFontStyle: 'normal',
    inputMode: 'latex',       // latex | asciimath | mathml
    scriptMode: false,
    history: [],              // 最近 20 条公式
  },

  /**
   * 读取一个偏好值
   * @param {string} key - 键名（不含前缀）
   * @returns {*} 存储的值或默认值
   */
  get(key) {
    try {
      const raw = localStorage.getItem(this.KEY + key);
      if (raw === null) return this.DEFAULTS[key];
      return JSON.parse(raw);
    } catch (e) {
      return this.DEFAULTS[key];
    }
  },

  /**
   * 写入一个偏好值
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      localStorage.setItem(this.KEY + key, JSON.stringify(value));
    } catch (e) {
      // localStorage 满或不可用，静默失败
    }
  },

  /**
   * 读取所有偏好到 App 状态对象
   */
  loadAll() {
    App.currentBg        = this.get('currentBg');
    App.customBgColor    = this.get('customBgColor');
    App.currentFont      = this.get('currentFont');
    App.currentFontWeight = this.get('currentFontWeight');
    App.currentFontStyle  = this.get('currentFontStyle');
    App.inputMode        = this.get('inputMode');
    App.scriptMode       = this.get('scriptMode');
    App.history          = this.get('history') || [];
  },

  /**
   * 保存当前 App 状态到 localStorage
   */
  saveAll() {
    this.set('currentBg', App.currentBg);
    this.set('customBgColor', App.customBgColor);
    this.set('currentFont', App.currentFont);
    this.set('currentFontWeight', App.currentFontWeight);
    this.set('currentFontStyle', App.currentFontStyle);
    this.set('inputMode', App.inputMode);
    this.set('scriptMode', App.scriptMode);
    this.set('history', App.history);
  },

  /**
   * 保存颜色/大小/边距/导出格式（从 DOM 读取）
   */
  saveFromDOM() {
    const fc = document.getElementById('formulaColor');
    const fs = document.getElementById('fontSize');
    const pd = document.getElementById('padding');
    const ef = document.getElementById('exportFormat');
    const bg = document.getElementById('bgColor');
    if (fc) this.set('formulaColor', fc.value);
    if (fs) this.set('fontSize', parseInt(fs.value));
    if (pd) this.set('padding', parseInt(pd.value));
    if (ef) this.set('exportFormat', ef.value);
    if (bg) this.set('customBgColor', bg.value);
  },

  /**
   * 恢复 DOM 控件的值
   */
  restoreDOM() {
    const fc = document.getElementById('formulaColor');
    const fs = document.getElementById('fontSize');
    const pd = document.getElementById('padding');
    const ef = document.getElementById('exportFormat');
    const bg = document.getElementById('bgColor');
    const fsv = document.getElementById('fontSizeVal');
    const pdv = document.getElementById('paddingVal');
    if (fc) fc.value = this.get('formulaColor');
    if (fs) { fs.value = this.get('fontSize'); if (fsv) fsv.textContent = fs.value + 'px'; }
    if (pd) { pd.value = this.get('padding'); if (pdv) pdv.textContent = pd.value + 'px'; }
    if (ef) ef.value = this.get('exportFormat');
    if (bg) bg.value = this.get('customBgColor');
  }
};
