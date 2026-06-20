/* ============================================================
   font-manager.js — Module 1: Font Selection & Import
   ============================================================ */

class FontManager {
  constructor() {
    /** @type {Map<string, {family: string, source: string, weight: number, style: string}>} */
    this.customFonts = new Map();
    this.presetFonts = [
      'Latin Modern',
      'STIX',
      'Noto Serif',
      'Times New Roman',
      'Computer Modern',
      'Palatino Linotype',
      'Georgia',
      'Cambria Math',
      'XITS',
      'Asana Math',
      'TeX Gyre Termes',
      'TeX Gyre Pagella',
      'TeX Gyre Schola',
      'TeX Gyre Bonum',
    ];
  }

  /** Get available fonts (presets + custom imported) */
  getAvailableFonts() {
    const list = [...this.presetFonts];
    this.customFonts.forEach((font, name) => {
      if (!list.includes(name)) list.push(name);
    });
    return list;
  }

  /** Load a Google Font by name */
  loadGoogleFont(fontName, weight = '400', style = 'normal') {
    const family = fontName.replace(/\s+/g, '+');
    let url = `https://fonts.googleapis.com/css2?family=${family}`;
    if (weight !== '400' || style !== 'normal') {
      const italic = style === 'italic' ? 'ital,' : '';
      url += `:${italic}wght@${weight}`;
    }
    url += '&display=swap';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.id = 'google-font-link';
    // Remove previous
    const old = document.getElementById('google-font-link');
    if (old) old.remove();
    document.head.appendChild(link);

    this.customFonts.set(fontName, {
      family: fontName,
      source: 'google',
      weight: parseInt(weight),
      style: style
    });

    return fontName;
  }

  /** Load a font from a URL */
  loadFontFromURL(fontName, url, weight = 400, style = 'normal') {
    const format = url.endsWith('.woff2') ? 'woff2'
      : url.endsWith('.woff') ? 'woff'
      : url.endsWith('.otf') ? 'opentype'
      : url.endsWith('.ttf') ? 'truetype'
      : 'truetype';

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @font-face {
        font-family: "${fontName}";
        src: url("${url}") format("${format}");
        font-weight: ${weight};
        font-style: ${style};
        font-display: swap;
      }
    `;
    const id = `custom-font-${fontName.replace(/\s+/g, '-')}`;
    const old = document.getElementById(id);
    if (old) old.remove();
    styleEl.id = id;
    document.head.appendChild(styleEl);

    this.customFonts.set(fontName, {
      family: fontName,
      source: url,
      weight: weight,
      style: style
    });

    return fontName;
  }

  /** Load a font from a local file (File object) */
  loadFontFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const fontName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '');
        const format = file.name.endsWith('.woff2') ? 'woff2'
          : file.name.endsWith('.woff') ? 'woff'
          : file.name.endsWith('.otf') ? 'opentype'
          : 'truetype';

        const styleEl = document.createElement('style');
        styleEl.textContent = `
          @font-face {
            font-family: "${fontName}";
            src: url("${dataUrl}") format("${format}");
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
        `;
        const id = `custom-font-${fontName.replace(/\s+/g, '-')}`;
        const old = document.getElementById(id);
        if (old) old.remove();
        styleEl.id = id;
        document.head.appendChild(styleEl);

        this.customFonts.set(fontName, {
          family: fontName,
          source: 'local-file',
          weight: 400,
          style: 'normal'
        });

        resolve(fontName);
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /** Apply a font globally (update App state + refresh render) */
  applyFont(fontName, weight = 400, style = 'normal') {
    App.currentFont = fontName;
    App.currentFontWeight = weight;
    App.currentFontStyle = style;

    // Apply to formula render container
    Renderer.applyFontCSS(fontName, weight, style);

    // Update dropdown
    const fontSelect = document.getElementById('fontSelect');
    if (fontSelect && fontSelect.value !== fontName) {
      fontSelect.value = fontName;
    }

    Renderer.scheduleRender();
  }
}
