/* ============================================================
   preprocessor.js — Module 4: Turing-Complete Preprocessor
   ============================================================ */

class Preprocessor {
  constructor() {
    /** @type {Map<string, string|number>} variable store */
    this.vars = new Map();
    this.maxRecursionDepth = 100;
  }

  /**
   * Process LaTeX source: expand all custom preprocessor directives
   * @param {string} source - raw LaTeX input
   * @returns {string} processed LaTeX
   */
  process(source) {
    this.vars.clear();
    let result = source;
    let depth = 0;
    let changed = true;

    while (changed && depth < this.maxRecursionDepth) {
      changed = false;
      depth++;

      // Process: \defvar{name}{value}
      result = result.replace(
        /\\defvar\{([^}]+)\}\{([^}]*)\}/g,
        (match, name, value) => {
          const resolved = this._resolveVars(value);
          this.vars.set(name.trim(), resolved);
          changed = true;
          return ''; // defvar produces no output
        }
      );

      // Process: \forloop{var}{start}{end}{step}{body}
      result = result.replace(
        /\\forloop\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}\{([^}]*)\}/g,
        (match, loopVar, startStr, endStr, stepStr, body) => {
          changed = true;
          const start = this._eval(this._resolveVars(startStr));
          const end = this._eval(this._resolveVars(endStr));
          const step = this._eval(this._resolveVars(stepStr));
          let output = '';
          for (let i = start; i <= end; i += step) {
            this.vars.set(loopVar.trim(), i);
            output += this._resolveVars(body);
          }
          return output;
        }
      );

      // Process: \ifcond{expr}{true_branch}{false_branch}
      result = result.replace(
        /\\ifcond\{([^}]+)\}\{([^}]*)\}\{([^}]*)\}/g,
        (match, expr, trueBranch, falseBranch) => {
          changed = true;
          const isTrue = this._evalCondition(this._resolveVars(expr));
          return isTrue ? trueBranch : falseBranch;
        }
      );

      // Process: \eval{expression} — evaluate arithmetic and return string
      result = result.replace(
        /\\eval\{([^}]+)\}/g,
        (match, expr) => {
          changed = true;
          return String(this._eval(this._resolveVars(expr)));
        }
      );

      // Process: \usevar{name}
      result = result.replace(
        /\\usevar\{([^}]+)\}/g,
        (match, name) => {
          const val = this.vars.get(name.trim());
          return val !== undefined ? String(val) : match;
        }
      );

      // Process: \concat{a}{b}
      result = result.replace(
        /\\concat\{([^}]+)\}\{([^}]+)\}/g,
        (match, a, b) => {
          changed = true;
          return this._resolveVars(a) + this._resolveVars(b);
        }
      );

      // Process: \rep{text}{n}
      result = result.replace(
        /\\rep\{([^}]+)\}\{([^}]+)\}/g,
        (match, text, nStr) => {
          changed = true;
          const n = this._eval(this._resolveVars(nStr));
          return this._resolveVars(text).repeat(Math.max(0, Math.min(n, 1000)));
        }
      );
    }

    if (depth >= this.maxRecursionDepth) {
      throw new Error(`超过最大递归深度 (${this.maxRecursionDepth})`);
    }

    return result;
  }

  /** Replace all \usevar references in a string */
  _resolveVars(str) {
    return str.replace(/\\usevar\{([^}]+)\}/g, (match, name) => {
      const val = this.vars.get(name.trim());
      return val !== undefined ? String(val) : '0';
    });
  }

  /** Evaluate an arithmetic expression */
  _eval(expr) {
    try {
      // Replace variable references
      let resolved = expr.replace(/[a-zA-Z_]\w*/g, (token) => {
        if (this.vars.has(token)) return String(this.vars.get(token));
        // Keep known math functions
        if (['sin', 'cos', 'tan', 'log', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'exp', 'pow', 'PI', 'E'].includes(token)) return token;
        return token;
      });
      resolved = resolved.replace(/\^/g, '**'); // ^ to ** for exponentiation
      // Safety: only allow safe arithmetic
      const safe = resolved.replace(/[^0-9+\-*/().%\s]/g, '');
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + safe)();
      return Number.isFinite(result) ? result : 0;
    } catch (e) {
      return 0;
    }
  }

  /** Evaluate a condition expression */
  _evalCondition(expr) {
    // Support: a==b, a!=b, a>b, a<b, a>=b, a<=b
    const match = expr.match(/^(.+?)(==|!=|>=|<=|>|<)(.+)$/);
    if (match) {
      const left = this._eval(match[1].trim());
      const op = match[2];
      const right = this._eval(match[3].trim());
      switch (op) {
        case '==': return left == right;
        case '!=': return left != right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case '>':  return left > right;
        case '<':  return left < right;
      }
    }
    // If just a number, treat as boolean (nonzero = true)
    return !!this._eval(expr);
  }
}
