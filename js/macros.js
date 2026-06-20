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
}
