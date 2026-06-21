/* ============================================================
   font-manager.js — 字体管理（选择 + 导入 + UI 绑定）
   内置：数学字体 / 系统字体 / Google Fonts 国内镜像 / URL 导入 / 拖拽上传
   ============================================================ */

class FontManager {
  constructor() {
    /** 用户导入的自定义字体 */
    this.customFonts = new Map();

    /** 预设数学排版字体 */
    this.mathFonts = [
      'Latin Modern', 'STIX', 'Noto Serif', 'Times New Roman',
      'Computer Modern', 'Palatino Linotype', 'Georgia', 'Cambria Math',
      'XITS', 'Asana Math', 'TeX Gyre Termes', 'TeX Gyre Pagella',
      'TeX Gyre Schola', 'TeX Gyre Bonum',
    ];

    /** 系统内置字体（离线可用） */
    this.systemFonts = this._detectSystemFonts();
  }

  /**
   * 检测操作系统可用的内置字体列表
   * 这些字体通过 CSS font-family 回退机制直接可用，无需额外加载
   * @returns {string[]}
   */
  _detectSystemFonts() {
    const fonts = [];
    // 通用回退字体
    fonts.push('system-ui, sans-serif', 'serif', 'monospace');
    // Windows 中文字体
    fonts.push('Microsoft YaHei', 'SimSun', 'SimHei', 'KaiTi', 'FangSong');
    // macOS / iOS 中文字体
    fonts.push('PingFang SC', 'PingFang TC', 'Hiragino Sans GB', 'STSong');
    // Linux 中文字体
    fonts.push('Noto Sans CJK SC', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei');
    // 英文等宽字体
    fonts.push('Consolas', 'Courier New', 'Arial', 'Helvetica', 'Verdana', 'Tahoma');
    return fonts;
  }

  /** 获取全部可用字体（数学 + 系统 + 自定义） */
  getAvailableFonts() {
    const all = [...this.mathFonts, ...this.systemFonts];
    this.customFonts.forEach((_, name) => {
      if (!all.includes(name)) all.push(name);
    });
    return all;
  }

  /**
   * 从 Google Fonts 国内镜像加载字体
   * @param {string} fontName — 字体名称
   * @param {string|number} weight
   * @param {string} style
   */
  loadGoogleFont(fontName, weight = '400', style = 'normal') {
    const family = fontName.replace(/\s+/g, '+');
    const urls = [
      `https://fonts.googleapis.cn/css2?family=${family}:wght@${weight}&display=swap`,
      `https://fonts.font.im/css2?family=${family}:wght@${weight}&display=swap`,
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
    ];
    this._tryLoad(urls, fontName, weight, style);
    return fontName;
  }

  /** 尝试多个镜像 URL，失败自动切换 */
  _tryLoad(urls, fontName, weight, style) {
    const old = document.getElementById('google-font-link');
    if (old) old.remove();

    const url = urls.shift();
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = url;
    link.id = 'google-font-link';
    document.head.appendChild(link);

    if (urls.length > 0) {
      link.addEventListener('error', () => {
        this._tryLoad(urls, fontName, weight, style);
      }, { once: true });
    }

    this.customFonts.set(fontName, {
      family: fontName, source: 'google',
      weight: parseInt(weight) || 400, style
    });
  }

  /**
   * 从 URL 加载字体文件
   * @param {string} fontName
   * @param {string} url
   * @param {number} weight
   * @param {string} style
   */
  loadFontFromURL(fontName, url, weight = 400, style = 'normal') {
    const fm = { '.woff2': 'woff2', '.woff': 'woff', '.otf': 'opentype', '.ttf': 'truetype' };
    const m = url.match(/\.(woff2?|ttf|otf)$/i);
    const format = m ? fm[m[0].toLowerCase()] : 'truetype';

    const el = document.createElement('style');
    el.textContent = `@font-face{font-family:"${fontName}";src:url("${url}") format("${format}");font-weight:${weight};font-style:${style};font-display:swap;}`;
    el.id = 'custom-font-' + fontName.replace(/\s+/g, '-');
    const old = document.getElementById(el.id); if (old) old.remove();
    document.head.appendChild(el);
    this.customFonts.set(fontName, { family: fontName, source: url, weight, style });
    return fontName;
  }

  /**
   * 从本地文件加载字体（拖拽/选择文件上传）
   * @param {File} file
   * @returns {Promise<string>} 字体名称
   */
  loadFontFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const name = file.name.replace(/\.(woff2?|ttf|otf)$/i, '');
        const fm = { '.woff2': 'woff2', '.woff': 'woff', '.otf': 'opentype', '.ttf': 'truetype' };
        const m = file.name.match(/\.(woff2?|ttf|otf)$/i);
        const format = m ? fm[m[0].toLowerCase()] : 'truetype';

        const el = document.createElement('style');
        el.textContent = `@font-face{font-family:"${name}";src:url("${e.target.result}") format("${format}");font-weight:400;font-style:normal;font-display:swap;}`;
        el.id = 'custom-font-' + name.replace(/\s+/g, '-');
        const old = document.getElementById(el.id); if (old) old.remove();
        document.head.appendChild(el);
        this.customFonts.set(name, { family: name, source: 'local-file', weight: 400, style: 'normal' });
        resolve(name);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 应用字体到全局并重新渲染
   * @param {string} fontName
   * @param {number} weight
   * @param {string} style
   */
  applyFont(fontName, weight = 400, style = 'normal') {
    App.currentFont = fontName;
    App.currentFontWeight = weight;
    App.currentFontStyle = style;
    Storage.saveAll();
    Renderer.applyFontCSS(fontName, weight, style);

    const sel = document.getElementById('fontSelect');
    if (sel && sel.value !== fontName) sel.value = fontName;
    Renderer.scheduleRender();
  }

  // ════════════════════════════════════════════════════════
  // UI 绑定（由 UIBindings.init() 调用）
  // ════════════════════════════════════════════════════════

  /** 初始化字体选择区域的所有交互事件 */
  initUI() {
    const fs  = document.getElementById('fontSelect');
    const fws = document.getElementById('fontWeightSelect');
    const fss = document.getElementById('fontStyleSelect');
    const gfi = document.getElementById('googleFontInput');
    const gfb = document.getElementById('googleFontBtn');
    const ufi = document.getElementById('urlFontInput');
    const ufn = document.getElementById('urlFontNameInput');
    const ufb = document.getElementById('urlFontBtn');
    const dz  = document.getElementById('fontDropZone');
    const fst = document.getElementById('fontStatus');

    this._refreshDropdown();

    fs.addEventListener('change', () => {
      this.applyFont(fs.value, parseInt(fws.value) || 400, fss.value || 'normal');
    });
    fws.addEventListener('change', () => {
      this.applyFont(fs.value, parseInt(fws.value) || 400, fss.value || 'normal');
    });
    fss.addEventListener('change', () => {
      this.applyFont(fs.value, parseInt(fws.value) || 400, fss.value || 'normal');
    });

    // Google Font 导入
    gfb.addEventListener('click', () => {
      const name = gfi.value.trim();
      if (!name) { fst.textContent = '请输入字体名称'; fst.className = 'error'; return; }
      this.loadGoogleFont(name);
      this._refreshDropdown();
      fs.value = name;
      this.applyFont(name);
      fst.textContent = '✓ 已加载: ' + name;
      fst.className = '';
    });

    // URL 字体导入
    ufb.addEventListener('click', () => {
      const url = ufi.value.trim();
      if (!url) { fst.textContent = '请输入字体文件 URL'; fst.className = 'error'; return; }
      const name = ufn.value.trim() || url.split('/').pop().replace(/\.[^.]+$/, '');
      this.loadFontFromURL(name, url);
      this._refreshDropdown();
      fs.value = name;
      this.applyFont(name);
      fst.textContent = '✓ 已加载: ' + name;
      fst.className = '';
    });

    // 拖拽/点击上传字体文件
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', async (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      for (const file of e.dataTransfer.files) {
        if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
          fst.textContent = '不支持的文件格式，请上传 .woff2 / .ttf / .otf';
          fst.className = 'error';
          continue;
        }
        try {
          const name = await this.loadFontFromFile(file);
          this._refreshDropdown(); fs.value = name; this.applyFont(name);
          fst.textContent = '✓ 已导入: ' + name; fst.className = '';
        } catch (err) {
          fst.textContent = '导入失败: ' + err.message; fst.className = 'error';
        }
      }
    });

    dz.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.woff2,.woff,.ttf,.otf';
      inp.onchange = async () => {
        if (!inp.files || inp.files.length === 0) return;
        for (const file of inp.files) {
          try {
            const name = await this.loadFontFromFile(file);
            this._refreshDropdown(); fs.value = name; this.applyFont(name);
            fst.textContent = '✓ 已导入: ' + name; fst.className = '';
          } catch (err) {
            fst.textContent = '导入失败: ' + err.message; fst.className = 'error';
          }
        }
      };
      inp.click();
    });
  },

  /** 刷新字体下拉框 */
  _refreshDropdown() {
    const sel = document.getElementById('fontSelect');
    if (!sel) return;
    const fonts = this.getAvailableFonts();
    sel.innerHTML = fonts.map(f =>
      `<option value="${f}" ${f === App.currentFont ? 'selected' : ''}>${f}</option>`
    ).join('');
  }
};
