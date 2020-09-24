export const PROXY_SUFFIX = '?commonjs-proxy';
export const getProxyId = (id) => `\0${id}${PROXY_SUFFIX}`;
export const getIdFromProxyId = (proxyId) => proxyId.slice(1, -PROXY_SUFFIX.length);

export const EXTERNAL_SUFFIX = '?commonjs-external';
export const getExternalProxyId = (id) => `\0${id}${EXTERNAL_SUFFIX}`;
export const getIdFromExternalProxyId = (proxyId) => proxyId.slice(1, -EXTERNAL_SUFFIX.length);

export const VIRTUAL_PATH_BASE = '/$$rollup_base$$';
export const getVirtualPathForDynamicRequirePath = (path, commonDir) => {
  if (path.startsWith(commonDir)) return VIRTUAL_PATH_BASE + path.slice(commonDir.length);
  return path;
};

export const DYNAMIC_REGISTER_PREFIX = '\0commonjs-dynamic-register:';
export const DYNAMIC_JSON_PREFIX = '\0commonjs-dynamic-json:';
export const DYNAMIC_PACKAGES_ID = '\0commonjs-dynamic-packages';

export const HELPERS_ID = '\0commonjsHelpers.js';

// `x['default']` is used instead of `x.default` for backward compatibility with ES3 browsers.
// Minifiers like uglify will usually transpile it back if compatibility with ES3 is not enabled.
// This will no longer be necessary once Rollup switches to ES6 output, likely
// in Rollup 3

// The "hasOwnProperty" call in "getDefaultExportFromCjs" is technically not
// needed, but for consumers that use Rollup's old interop pattern, it will fix
// rollup/rollup-plugin-commonjs#224
// We should remove it once Rollup core and this plugin are updated to not use
// this pattern any more
const HELPERS = `
export var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

export function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

export function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

export function getDefaultExportFromNamespaceIfPresent (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') ? n['default'] : n;
}

export function getDefaultExportFromNamespaceIfNotNamed (n) {
	return n && Object.prototype.hasOwnProperty.call(n, 'default') && Object.keys(n).length === 1 ? n['default'] : n;
}

export function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
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

const HELPER_NON_DYNAMIC = `
export function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}
`;

const HELPERS_DYNAMIC = `
export function commonjsRegister (path, loader) {
	DYNAMIC_REQUIRE_LOADERS[path] = loader;
}

const DYNAMIC_REQUIRE_LOADERS = Object.create(null);
const DYNAMIC_REQUIRE_CACHE = Object.create(null);
const DEFAULT_PARENT_MODULE = {
	id: '<' + 'rollup>', exports: {}, parent: undefined, filename: null, loaded: false, children: [], paths: []
};
const CHECKED_EXTENSIONS = ['', '.js', '.json'];

function normalize (path) {
	path = path.replace(/\\\\/g, '/');
	const parts = path.split('/');
	const slashed = parts[0] === '';
	for (let i = 1; i < parts.length; i++) {
		if (parts[i] === '.' || parts[i] === '') {
			parts.splice(i--, 1);
		}
	}
	for (let i = 1; i < parts.length; i++) {
		if (parts[i] !== '..') continue;
		if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
			parts.splice(--i, 2);
			i--;
		}
	}
	path = parts.join('/');
	if (slashed && path[0] !== '/')
	  path = '/' + path;
	else if (path.length === 0)
	  path = '.';
	return path;
}

function join () {
	if (arguments.length === 0)
	  return '.';
	let joined;
	for (let i = 0; i < arguments.length; ++i) {
	  let arg = arguments[i];
	  if (arg.length > 0) {
		if (joined === undefined)
		  joined = arg;
		else
		  joined += '/' + arg;
	  }
	}
	if (joined === undefined)
	  return '.';

	return joined;
}

function isPossibleNodeModulesPath (modulePath) {
	let c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	let c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\'))
		return false;
	return true;
}

function dirname (path) {
  if (path.length === 0)
    return '.';

  let i = path.length - 1;
  while (i > 0) {
    const c = path.charCodeAt(i);
    if ((c === 47 || c === 92) && i !== path.length - 1)
      break;
    i--;
  }

  if (i > 0)
    return path.substr(0, i);

  if (path.chartCodeAt(0) === 47 || path.chartCodeAt(0) === 92)
    return path.charAt(0);

  return '.';
}

export function commonjsRequire (path, originalModuleDir) {
	const shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	let relPath;
	while (true) {
		if (!shouldTryNodeModules) {
			relPath = originalModuleDir ? normalize(originalModuleDir + '/' + path) : path;
		} else if (originalModuleDir) {
			relPath = normalize(originalModuleDir + '/node_modules/' + path);
		} else {
			relPath = normalize(join('node_modules', path));
		}
		for (let extensionIndex = 0; extensionIndex < CHECKED_EXTENSIONS.length; extensionIndex++) {
			const resolvedPath = relPath + CHECKED_EXTENSIONS[extensionIndex];
			let cachedModule = DYNAMIC_REQUIRE_CACHE[resolvedPath];
			if (cachedModule) return cachedModule.exports;
			const loader = DYNAMIC_REQUIRE_LOADERS[resolvedPath];
			if (loader) {
				DYNAMIC_REQUIRE_CACHE[resolvedPath] = cachedModule = {
					id: resolvedPath,
					filename: resolvedPath,
					path: dirname(resolvedPath),
					exports: {},
					parent: DEFAULT_PARENT_MODULE,
					loaded: false,
					children: [],
					paths: [],
					require: function (path, base) {
					  return commonjsRequire(path, (base === undefined || base === null) ? cachedModule.path : base);
					}
				};
				try {
					loader.call(commonjsGlobal, cachedModule, cachedModule.exports);
				} catch (error) {
					delete DYNAMIC_REQUIRE_CACHE[resolvedPath];
					throw error;
				}
				cachedModule.loaded = true;
				return cachedModule.exports;
			};
		}
		if (!shouldTryNodeModules) break;
		const nextDir = normalize(originalModuleDir + '/..');
		if (nextDir === originalModuleDir) break;
		originalModuleDir = nextDir;
	}
	return require(path);
}

commonjsRequire.cache = DYNAMIC_REQUIRE_CACHE;
`;

export function getHelpersModule(isDynamicRequireModulesEnabled) {
  return `${HELPERS}${isDynamicRequireModulesEnabled ? HELPERS_DYNAMIC : HELPER_NON_DYNAMIC}`;
}
