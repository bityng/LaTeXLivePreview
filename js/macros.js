/* ============================================================
   macros.js — Module 3: Custom Command System (\newcommand)
   ============================================================ */

class MacroManager {
  constructor() {
    /**
     * Map of macro name → { definition, argCount }
     * e.g. "R" → { definition: "\\mathbb{R}", argCount: 0 }
     * e.g. "norm" → { definition: "\\left\\|#1\\right\\|", argCount: 1 }
     */
    this.macros = new Map();
  }

  /** Add or update a macro. Returns true on success, or throws on conflict. */
  addMacro(name, definition, argCount = 0) {
    // Remove leading backslash if present
    const cleanName = name.replace(/^\\/, '');

    // Conflict detection: check if it's already defined as a standard LaTeX command
    // (Simple heuristic: single-letter commands like \a, \b etc. are likely standard)
    const standardCommands = [
      'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
      'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
      'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
      'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma',
      'Upsilon', 'Phi', 'Psi', 'Omega',
      'int', 'sum', 'prod', 'frac', 'sqrt', 'partial', 'infty',
      'mathbb', 'mathbf', 'mathcal', 'mathfrak', 'mathit', 'mathrm',
      'left', 'right', 'langle', 'rangle', 'lbrace', 'rbrace',
      'begin', 'end', 'text', 'mathbf', 'overrightarrow',
      'cdot', 'times', 'div', 'pm', 'mp', 'ast', 'star',
      'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'exp',
      'det', 'dim', 'gcd', 'hom', 'ker', 'Pr', 'sup', 'inf',
      'max', 'min', 'mod', 'bmod', 'pmod', 'pod',
      'vec', 'hat', 'tilde', 'bar', 'dot', 'ddot', 'check', 'acute', 'grave', 'breve',
      'not', 'neg', 'land', 'lor', 'forall', 'exists',
    ];
    if (standardCommands.includes(cleanName)) {
      return { ok: false, warning: `⚠ \\${cleanName} 是标准 LaTeX 命令，覆盖可能导致意外行为` };
    }

    this.macros.set(cleanName, { definition, argCount });

    // Refresh the injected macros in MathJax
    this.injectToMathJax();
    return { ok: true };
  }

  /** Remove a macro by name */
  removeMacro(name) {
    const cleanName = name.replace(/^\\/, '');
    this.macros.delete(cleanName);
    this.injectToMathJax();
  }

  /** Get all macros as an array */
  getAll() {
    const result = [];
    this.macros.forEach((val, key) => {
      result.push({ name: key, definition: val.definition, argCount: val.argCount });
    });
    return result;
  }

  /** Clear all macros */
  clearAll() {
    this.macros.clear();
    this.injectToMathJax();
  }

  /** Build a MathJax-compatible macros object and inject it */
  injectToMathJax() {
    // MathJax uses a macros object in the TeX input processor
    // We need to rebuild the MathJax configuration
    const macrosObj = {};
    this.macros.forEach((val, key) => {
      if (val.argCount === 0) {
        macrosObj[key] = val.definition;
      } else {
        macrosObj[key] = [val.argCount, val.definition];
      }
    });

    // Update MathJax's tex input processor macros
    if (window.MathJax && MathJax.config && MathJax.config.tex) {
      MathJax.config.tex.macros = macrosObj;
    }

    // Also set via the startup object if available
    if (window.MathJax && MathJax.startup) {
      MathJax.startup.ready();
    }
  }

  /** Export macros to JSON string */
  exportToJSON() {
    const data = [];
    this.macros.forEach((val, key) => {
      data.push({ name: key, definition: val.definition, argCount: val.argCount });
    });
    return JSON.stringify(data, null, 2);
  }

  /** Import macros from JSON string. Returns count of imported macros. */
  importFromJSON(jsonStr) {
    const data = JSON.parse(jsonStr);
    let count = 0;
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.name && item.definition !== undefined) {
          const res = this.addMacro(item.name, item.definition, item.argCount || 0);
          if (res.ok) count++;
        }
      });
    }
    this.injectToMathJax();
    return count;
  }

  // ════════════════════════════════════════════════════════
  // UI 绑定（由 UIBindings 调用）—— 定义、添加、删除、导入导出
  // ════════════════════════════════════════════════════════
  /** 初始化宏管理区域的 UI 事件 */
  initUI() {
    const nameInp  = document.getElementById('macroNameInput');
    const defInp   = document.getElementById('macroDefInput');
    const argInp   = document.getElementById('macroArgInput');
    const addBtn   = document.getElementById('macroAddBtn');
    const tagsEl   = document.getElementById('macroTags');
    const expBtn   = document.getElementById('macroExportBtn');
    const impBtn   = document.getElementById('macroImportBtn');
    const clrBtn   = document.getElementById('macroClearBtn');

    /** 刷新宏标签显示 */
    const refreshTags = () => {
      if (!tagsEl) return;
      const all = this.getAll();
      tagsEl.innerHTML = all.map(m =>
        `<span class="macro-tag" data-name="${m.name}" title="点击编辑 | × 删除">
          <span class="macro-name">\\${m.name}</span>
          ${m.argCount > 0 ? `<span style="font-size:0.6rem">[${m.argCount}参]</span>` : ''}
          <span class="macro-delete">&times;</span>
        </span>`
      ).join('') || '<span style="color:var(--muted);font-size:0.7rem;">暂无自定义宏</span>';
    };

    // 添加宏
    addBtn.addEventListener('click', () => {
      const name = nameInp.value.trim();
      const def  = defInp.value.trim();
      const argc = parseInt(argInp.value) || 0;
      if (!name || !def) return;
      const result = this.addMacro(name, def, argc);
      if (!result.ok && result.warning) {
        if (!confirm(result.warning + '\n\n确定要继续吗？')) return;
        const clean = name.replace(/^\\/, '');
        this.macros.set(clean, { definition: def, argCount: argc });
        this.injectToMathJax();
      }
      refreshTags();
      nameInp.value = ''; defInp.value = ''; argInp.value = '0';
      Renderer.scheduleRender();
    });

    // 预设宏模板按钮
    document.querySelectorAll('.macro-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        nameInp.value = btn.dataset.name || '';
        defInp.value  = btn.dataset.def || '';
        argInp.value  = btn.dataset.args || '0';
      });
    });

    // 导出宏到 JSON 文件
    expBtn.addEventListener('click', () => {
      const json = this.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.download = 'latex-macros.json';
      a.href = URL.createObjectURL(blob);
      a.click();
    });

    // 从 JSON 文件导入宏
    impBtn.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json';
      inp.onchange = () => {
        const file = inp.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const count = this.importFromJSON(e.target.result);
          refreshTags();
          Renderer.scheduleRender();
          alert('已导入 ' + count + ' 个宏定义');
        };
        reader.readAsText(file);
      };
      inp.click();
    });

    // 清除所有宏
    clrBtn.addEventListener('click', () => {
      if (confirm('确定要清除所有自定义宏吗？')) {
        this.clearAll();
        refreshTags();
        Renderer.scheduleRender();
      }
    });

    // 点击标签：编辑或删除
    tagsEl.addEventListener('click', (e) => {
      const tag = e.target.closest('.macro-tag');
      if (!tag) return;
      const name = tag.dataset.name;
      if (e.target.classList.contains('macro-delete')) {
        this.removeMacro(name);
        refreshTags();
        Renderer.scheduleRender();
      } else {
        const macro = this.macros.get(name);
        if (macro) {
          nameInp.value = name;
          defInp.value  = macro.definition;
          argInp.value  = macro.argCount;
        }
      }
    });
  }
}
