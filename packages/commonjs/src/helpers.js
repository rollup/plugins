export const isWrappedId = (id, suffix) => id.endsWith(suffix);
export const wrapId = (id, suffix) => `\0${id}${suffix}`;
export const unwrapId = (wrappedId, suffix) => wrappedId.slice(1, -suffix.length);

export const PROXY_SUFFIX = '?commonjs-proxy';
export const REQUIRE_SUFFIX = '?commonjs-require';
export const EXTERNAL_SUFFIX = '?commonjs-external';
export const EXPORTS_SUFFIX = '?commonjs-exports';
export const MODULE_SUFFIX = '?commonjs-module';

export const DYNAMIC_REGISTER_SUFFIX = '?commonjs-dynamic-register';
export const DYNAMIC_JSON_PREFIX = '\0commonjs-dynamic-json:';
export const DYNAMIC_PACKAGES_ID = '\0commonjs-dynamic-packages';

export const HELPERS_ID = '\0commonjsHelpers.js';

// `x['default']` is used instead of `x.default` for backward compatibility with ES3 browsers.
// Minifiers like uglify will usually transpile it back if compatibility with ES3 is not enabled.
// This will no longer be necessary once Rollup switches to ES6 output, likely
// in Rollup 3

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

const FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;

const HELPER_NON_DYNAMIC = `
export function commonjsRequire (path) {
	${FAILED_REQUIRE_ERROR}
}
`;

const getDynamicHelpers = (ignoreDynamicRequires) => `
export function createModule(modulePath) {
	return {
		path: modulePath,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, base == null ? modulePath : base);
		}
	};
}

export function commonjsRegister (path, loader) {
	DYNAMIC_REQUIRE_LOADERS[path] = loader;
}

export function commonjsRegisterOrShort (path, to) {
	var resolvedPath = commonjsResolveImpl(path, null, true);
	if (resolvedPath !== null && DYNAMIC_REQUIRE_CACHE[resolvedPath]) {
	  DYNAMIC_REQUIRE_CACHE[path] = DYNAMIC_REQUIRE_CACHE[resolvedPath];
	} else {
	  DYNAMIC_REQUIRE_SHORTS[path] = to;
	}
}

var DYNAMIC_REQUIRE_LOADERS = Object.create(null);
var DYNAMIC_REQUIRE_CACHE = Object.create(null);
var DYNAMIC_REQUIRE_SHORTS = Object.create(null);
var DEFAULT_PARENT_MODULE = {
	id: '<' + 'rollup>', exports: {}, parent: undefined, filename: null, loaded: false, children: [], paths: []
};
var CHECKED_EXTENSIONS = ['', '.js', '.json'];

function normalize (path) {
	path = path.replace(/\\\\/g, '/');
	var parts = path.split('/');
	var slashed = parts[0] === '';
	for (var i = 1; i < parts.length; i++) {
		if (parts[i] === '.' || parts[i] === '') {
			parts.splice(i--, 1);
		}
	}
	for (var i = 1; i < parts.length; i++) {
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
	var joined;
	for (var i = 0; i < arguments.length; ++i) {
	  var arg = arguments[i];
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
	var c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	var c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\'))
		return false;
	return true;
}

function dirname (path) {
  if (path.length === 0)
    return '.';

  var i = path.length - 1;
  while (i > 0) {
    var c = path.charCodeAt(i);
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

export function commonjsResolveImpl (path, originalModuleDir, testCache) {
	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	var relPath;
	if (path[0] === '/') {
		originalModuleDir = '/';
	}
	while (true) {
		if (!shouldTryNodeModules) {
			relPath = originalModuleDir ? normalize(originalModuleDir + '/' + path) : path;
		} else if (originalModuleDir) {
			relPath = normalize(originalModuleDir + '/node_modules/' + path);
		} else {
			relPath = normalize(join('node_modules', path));
		}

		if (relPath.endsWith('/..')) {
			break; // Travelled too far up, avoid infinite loop
		}

		for (var extensionIndex = 0; extensionIndex < CHECKED_EXTENSIONS.length; extensionIndex++) {
			var resolvedPath = relPath + CHECKED_EXTENSIONS[extensionIndex];
			if (DYNAMIC_REQUIRE_CACHE[resolvedPath]) {
				return resolvedPath;
			}
			if (DYNAMIC_REQUIRE_SHORTS[resolvedPath]) {
			  return resolvedPath;
			}
			if (DYNAMIC_REQUIRE_LOADERS[resolvedPath]) {
				return resolvedPath;
			}
		}
		if (!shouldTryNodeModules) break;
		var nextDir = normalize(originalModuleDir + '/..');
		if (nextDir === originalModuleDir) break;
		originalModuleDir = nextDir;
	}
	return null;
}

export function commonjsResolve (path, originalModuleDir) {
	var resolvedPath = commonjsResolveImpl(path, originalModuleDir);
	if (resolvedPath !== null) {
		return resolvedPath;
	}
	return require.resolve(path);
}

export function commonjsRequire (path, originalModuleDir) {
	var resolvedPath = commonjsResolveImpl(path, originalModuleDir, true);
	if (resolvedPath !== null) {
    var cachedModule = DYNAMIC_REQUIRE_CACHE[resolvedPath];
    if (cachedModule) return cachedModule.exports;
    var shortTo = DYNAMIC_REQUIRE_SHORTS[resolvedPath];
    if (shortTo) {
      cachedModule = DYNAMIC_REQUIRE_CACHE[shortTo];
      if (cachedModule)
        return cachedModule.exports;
      resolvedPath = commonjsResolveImpl(shortTo, null, true);
    }
    var loader = DYNAMIC_REQUIRE_LOADERS[resolvedPath];
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
	${ignoreDynamicRequires ? 'return require(path);' : FAILED_REQUIRE_ERROR}
}

commonjsRequire.cache = DYNAMIC_REQUIRE_CACHE;
commonjsRequire.resolve = commonjsResolve;
`;

export function getHelpersModule(isDynamicRequireModulesEnabled, ignoreDynamicRequires) {
  return `${HELPERS}${
    isDynamicRequireModulesEnabled ? getDynamicHelpers(ignoreDynamicRequires) : HELPER_NON_DYNAMIC
  }`;
}
