/*
from https://github.com/substack/vm-browserify/blob/bfd7c5f59edec856dc7efe0b77a4f6b2fa20f226/index.js

MIT license no Copyright holder mentioned
*/

function Object_keys(obj) {
  if (Object.keys) return Object.keys(obj);

  const res = [];
  for (const key in obj) res.push(key);
  return res;
}

function forEach(xs, fn) {
  if (xs.forEach) return xs.forEach(fn);
  for (let i = 0; i < xs.length; i++) {
    fn(xs[i], i, xs);
  }
}
let _defineProp;

function defineProp(obj, name, value) {
  if (typeof _defineProp !== 'function') {
    _defineProp = createDefineProp;
  }
  _defineProp(obj, name, value);
}

function createDefineProp() {
  try {
    Object.defineProperty({}, '_', {});
    return function(obj, name, value) {
      Object.defineProperty(obj, name, {
        writable: true,
        enumerable: false,
        configurable: true,
        value
      });
    };
  } catch (e) {
    return function(obj, name, value) {
      obj[name] = value;
    };
  }
}

const globals = [
  'Array',
  'Boolean',
  'Date',
  'Error',
  'EvalError',
  'Function',
  'Infinity',
  'JSON',
  'Math',
  'NaN',
  'Number',
  'Object',
  'RangeError',
  'ReferenceError',
  'RegExp',
  'String',
  'SyntaxError',
  'TypeError',
  'URIError',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'escape',
  'eval',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'unescape'
];

function Context() {}
Context.prototype = {};

export function Script(code) {
  if (!(this instanceof Script)) return new Script(code);
  this.code = code;
}
function otherRunInContext(code, context) {
  const args = Object_keys(global);
  args.push('with (this.__ctx__){return eval(this.__code__)}');
  const fn = Function.apply(null, args);
  return fn.apply({
    __code__: code,
    __ctx__: context
  });
}
Script.prototype.runInContext = function(context) {
  if (!(context instanceof Context)) {
    throw new TypeError("needs a 'context' argument.");
  }
  if (global.document) {
    const iframe = global.document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';

    global.document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    let wEval = win.eval;
    const wExecScript = win.execScript;

    if (!wEval && wExecScript) {
      // win.eval() magically appears when this is called in IE:
      wExecScript.call(win, 'null');
      wEval = win.eval;
    }

    forEach(Object_keys(context), (key) => {
      win[key] = context[key];
    });
    forEach(globals, (key) => {
      if (context[key]) {
        win[key] = context[key];
      }
    });

    const winKeys = Object_keys(win);

    const res = wEval.call(win, this.code);

    forEach(Object_keys(win), (key) => {
      // Avoid copying circular objects like `top` and `window` by only
      // updating existing context properties or new properties in the `win`
      // that was only introduced after the eval.
      if (key in context || indexOf(winKeys, key) === -1) {
        context[key] = win[key];
      }
    });

    forEach(globals, (key) => {
      if (!(key in context)) {
        defineProp(context, key, win[key]);
      }
    });
    global.document.body.removeChild(iframe);

    return res;
  }
  return otherRunInContext(this.code, context);
};

Script.prototype.runInThisContext = function() {
  const fn = new Function('code', 'return eval(code);');
  return fn.call(global, this.code); // maybe...
};

Script.prototype.runInNewContext = function(context) {
  const ctx = createContext(context);
  const res = this.runInContext(ctx);
  if (context) {
    forEach(Object_keys(ctx), (key) => {
      context[key] = ctx[key];
    });
  }

  return res;
};

export function createScript(code) {
  return new Script(code);
}

export function createContext(context) {
  if (isContext(context)) {
    return context;
  }
  const copy = new Context();
  if (typeof context === 'object') {
    forEach(Object_keys(context), (key) => {
      copy[key] = context[key];
    });
  }
  return copy;
}
export function runInContext(code, contextifiedSandbox, options) {
  const script = new Script(code, options);
  return script.runInContext(contextifiedSandbox, options);
}
export function runInThisContext(code, options) {
  const script = new Script(code, options);
  return script.runInThisContext(options);
}
export function isContext(context) {
  return context instanceof Context;
}
export function runInNewContext(code, sandbox, options) {
  const script = new Script(code, options);
  return script.runInNewContext(sandbox, options);
}
export default {
  runInContext,
  isContext,
  createContext,
  createScript,
  Script,
  runInThisContext,
  runInNewContext
};

/*
from indexOf
@ author tjholowaychuk
@ license MIT
*/
const _indexOf = [].indexOf;

function indexOf(arr, obj) {
  if (_indexOf) return arr.indexOf(obj);
  for (let i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
}
