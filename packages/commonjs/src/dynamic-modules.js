import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

import glob from 'glob';

import { getVirtualPathForDynamicRequirePath, normalizePathSlashes } from './utils';

function getPackageEntryPoint(dirPath) {
  let entryPoint = 'index.js';

  try {
    if (existsSync(join(dirPath, 'package.json'))) {
      entryPoint =
        JSON.parse(readFileSync(join(dirPath, 'package.json'), { encoding: 'utf8' })).main ||
        entryPoint;
    }
  } catch (ignored) {
    // ignored
  }

  return entryPoint;
}

function isDirectory(path) {
  try {
    if (statSync(path).isDirectory()) return true;
  } catch (ignored) {
    // Nothing to do here
  }
  return false;
}

export function getDynamicRequireModules(patterns) {
  const dynamicRequireModules = new Map();
  for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
    const isNegated = pattern.startsWith('!');
    const modifyMap = (targetPath, resolvedPath) =>
      isNegated
        ? dynamicRequireModules.delete(targetPath)
        : dynamicRequireModules.set(targetPath, resolvedPath);
    for (const path of glob.sync(isNegated ? pattern.substr(1) : pattern)) {
      const resolvedPath = resolve(path);
      const requirePath = normalizePathSlashes(resolvedPath);
      if (isDirectory(resolvedPath)) {
        const modulePath = resolve(join(resolvedPath, getPackageEntryPoint(path)));
        modifyMap(requirePath, modulePath);
        modifyMap(normalizePathSlashes(modulePath), modulePath);
      } else {
        modifyMap(requirePath, resolvedPath);
      }
    }
  }
  return dynamicRequireModules;
}

const FAILED_REQUIRE_ERROR = `throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');`;

export function getDynamicModuleRegistry(
  isDynamicRequireModulesEnabled,
  dynamicRequireModules,
  commonDir,
  ignoreDynamicRequires
) {
  if (!isDynamicRequireModulesEnabled) {
    return `export function commonjsRequire(path) {
	${FAILED_REQUIRE_ERROR}
}`;
  }
  const dynamicModuleImports = [...dynamicRequireModules.values()]
    .map(
      (id, index) =>
        `import ${
          id.endsWith('.json') ? `json${index}` : `{ __require as require${index} }`
        } from ${JSON.stringify(id)};`
    )
    .join('\n');
  const dynamicModuleProps = [...dynamicRequireModules.keys()]
    .map(
      (id, index) =>
        `\t\t${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizePathSlashes(id), commonDir)
        )}: ${id.endsWith('.json') ? `function () { return json${index}; }` : `require${index}`}`
    )
    .join(',\n');
  return `${dynamicModuleImports}

var dynamicModules;

function getDynamicModules() {
	return dynamicModules || (dynamicModules = {
${dynamicModuleProps}
	});
}

export function commonjsRequire(path, originalModuleDir) {
	var resolvedPath = commonjsResolveImpl(path, originalModuleDir, true);
	if (resolvedPath !== null) {
		return getDynamicModules()[resolvedPath]();
	}
	${ignoreDynamicRequires ? 'return require(path);' : FAILED_REQUIRE_ERROR}
}

function commonjsResolve (path, originalModuleDir) {
	const resolvedPath = commonjsResolveImpl(path, originalModuleDir);
	if (resolvedPath !== null) {
		return resolvedPath;
	}
	return require.resolve(path);
}

commonjsRequire.resolve = commonjsResolve;

function commonjsResolveImpl (path, originalModuleDir) {
	var shouldTryNodeModules = isPossibleNodeModulesPath(path);
	path = normalize(path);
	var relPath;
	if (path[0] === '/') {
		originalModuleDir = '/';
	}
	var modules = getDynamicModules();
	var checkedExtensions = ['', '.js', '.json'];
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

		for (var extensionIndex = 0; extensionIndex < checkedExtensions.length; extensionIndex++) {
			var resolvedPath = relPath + checkedExtensions[extensionIndex];
			if (modules[resolvedPath]) {
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

function isPossibleNodeModulesPath (modulePath) {
	var c0 = modulePath[0];
	if (c0 === '/' || c0 === '\\\\') return false;
	var c1 = modulePath[1], c2 = modulePath[2];
	if ((c0 === '.' && (!c1 || c1 === '/' || c1 === '\\\\')) ||
		(c0 === '.' && c1 === '.' && (!c2 || c2 === '/' || c2 === '\\\\'))) return false;
	if (c1 === ':' && (c2 === '/' || c2 === '\\\\')) return false;
	return true;
}

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
	if (slashed && path[0] !== '/') path = '/' + path;
	else if (path.length === 0) path = '.';
	return path;
}

function join () {
	if (arguments.length === 0) return '.';
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
	if (joined === undefined) return '.';
	return joined;
}`;
}
