export const isWrappedId = (id, suffix) => id.endsWith(suffix);
export const wrapId = (id, suffix) => `\0${id}${suffix}`;
export const unwrapId = (wrappedId, suffix) => wrappedId.slice(1, -suffix.length);

// A proxy module when a module is required from non-wrapped CommonJS. Is different for ESM and CommonJS requires.
export const PROXY_SUFFIX = '?commonjs-proxy';
// Indicates that a required module is wrapped commonjs and needs special handling.
export const WRAPPED_SUFFIX = '?commonjs-wrapped';
// Indicates that a required module is external
export const EXTERNAL_SUFFIX = '?commonjs-external';
// A helper module that contains the exports object of a module
export const EXPORTS_SUFFIX = '?commonjs-exports';
// A helper module that contains the module object of a module, e.g. when module.exports is reassigned
export const MODULE_SUFFIX = '?commonjs-module';
// A special proxy for CommonJS entry points
export const ENTRY_SUFFIX = '?commonjs-entry';
// A proxy when wrapped ESM is required from CommonJS
export const ES_IMPORT_SUFFIX = '?commonjs-es-import';

export const DYNAMIC_MODULES_ID = '\0commonjs-dynamic-modules';
export const HELPERS_ID = '\0commonjsHelpers.js';

export const IS_WRAPPED_COMMONJS = 'withRequireFunction';

// `x['default']` is used instead of `x.default` for backward compatibility with ES3 browsers.
// Minifiers like uglify will usually transpile it back if compatibility with ES3 is not enabled.
// This could be improved by inspecting Rollup's "generatedCode" option

const HELPERS = `
export var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

export function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

export function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}
`;

export function getHelpersModule() {
  return HELPERS;
}
