import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import resolve from 'resolve';

import { getPackageInfo, getPackageName } from './util';
import { exists, realpath } from './fs';
import { isDirCached, isFileCached, readCachedFile } from './cache';

const resolveImportPath = promisify(resolve);
const readFile = promisify(fs.readFile);

const pathNotFoundError = (subPath, pkgPath) =>
  new Error(`Package subpath '${subPath}' is not defined by "exports" in ${pkgPath}`);

function findExportKeyMatch(exportMap, subPath) {
  for (const key of Object.keys(exportMap)) {
    if (key.endsWith('*')) {
      // star match: "./foo/*": "./foo/*.js"
      const keyWithoutStar = key.substring(0, key.length - 1);
      if (subPath.startsWith(keyWithoutStar)) {
        return key;
      }
    }

    if (key.endsWith('/') && subPath.startsWith(key)) {
      // directory match (deprecated by node): "./foo/": "./foo/.js"
      return key;
    }

    if (key === subPath) {
      // literal match
      return key;
    }
  }
  return null;
}

function mapSubPath(pkgJsonPath, subPath, key, value) {
  if (typeof value === 'string') {
    if (typeof key === 'string' && key.endsWith('*')) {
      // star match: "./foo/*": "./foo/*.js"
      const keyWithoutStar = key.substring(0, key.length - 1);
      const subPathAfterKey = subPath.substring(keyWithoutStar.length);
      return value.replace(/\*/g, subPathAfterKey);
    }

    if (value.endsWith('/')) {
      // directory match (deprecated by node): "./foo/": "./foo/.js"
      return `${value}${subPath.substring(key.length)}`;
    }

    // mapping is a string, for example { "./foo": "./dist/foo.js" }
    return value;
  }

  if (Array.isArray(value)) {
    // mapping is an array with fallbacks, for example { "./foo": ["foo:bar", "./dist/foo.js"] }
    return value.find((v) => v.startsWith('./'));
  }

  throw pathNotFoundError(subPath, pkgJsonPath);
}

function findEntrypoint(pkgJsonPath, subPath, exportMap, conditions, key) {
  if (typeof exportMap !== 'object') {
    return mapSubPath(pkgJsonPath, subPath, key, exportMap);
  }

  // iterate conditions recursively, find the first that matches all conditions
  for (const [condition, subExportMap] of Object.entries(exportMap)) {
    if (conditions.includes(condition)) {
      const mappedSubPath = findEntrypoint(pkgJsonPath, subPath, subExportMap, conditions, key);
      if (mappedSubPath) {
        return mappedSubPath;
      }
    }
  }
  throw pathNotFoundError(subPath, pkgJsonPath);
}

export function findEntrypointTopLevel(pkgJsonPath, subPath, exportMap, conditions) {
  if (typeof exportMap !== 'object') {
    // the export map shorthand, for example { exports: "./index.js" }
    if (subPath !== '.') {
      // shorthand only supports a main entrypoint
      throw pathNotFoundError(subPath, pkgJsonPath);
    }
    return mapSubPath(pkgJsonPath, subPath, null, exportMap);
  }

  // export map is an object, the top level can be either conditions or sub path mappings
  const keys = Object.keys(exportMap);
  const isConditions = keys.every((k) => !k.startsWith('.'));
  const isMappings = keys.every((k) => k.startsWith('.'));

  if (!isConditions && !isMappings) {
    throw new Error(
      `Invalid package config ${pkgJsonPath}, "exports" cannot contain some keys starting with '.'` +
        ' and some not. The exports object must either be an object of package subpath keys or an object of main entry' +
        ' condition name keys only.'
    );
  }

  let key = null;
  let exportMapForSubPath;

  if (isConditions) {
    // top level is conditions, for example { "import": ..., "require": ..., "module": ... }
    if (subPath !== '.') {
      // package with top level conditions means it only supports a main entrypoint
      throw pathNotFoundError(subPath, pkgJsonPath);
    }
    exportMapForSubPath = exportMap;
  } else {
    // top level is sub path mappings, for example { ".": ..., "./foo": ..., "./bar": ... }
    key = findExportKeyMatch(exportMap, subPath);
    if (!key) {
      throw pathNotFoundError(subPath, pkgJsonPath);
    }
    exportMapForSubPath = exportMap[key];
  }

  return findEntrypoint(pkgJsonPath, subPath, exportMapForSubPath, conditions, key);
}

async function resolveId({
  importPath,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories
}) {
  let hasModuleSideEffects = () => null;
  let hasPackageEntry = true;
  let packageBrowserField = false;
  let packageInfo;

  const filter = (pkg, pkgPath) => {
    const info = getPackageInfo({
      cache: packageInfoCache,
      extensions,
      pkg,
      pkgPath,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides
    });

    ({ packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = info);

    return info.cachedPkg;
  };

  const resolveOptions = {
    basedir: baseDir,
    readFile: readCachedFile,
    isFile: isFileCached,
    isDirectory: isDirCached,
    extensions,
    includeCoreModules: false,
    moduleDirectory: moduleDirectories,
    preserveSymlinks,
    packageFilter: filter
  };

  let location;

  const pkgName = getPackageName(importPath);
  if (pkgName) {
    let pkgJsonPath;
    let pkgJson;
    try {
      pkgJsonPath = await resolveImportPath(`${pkgName}/package.json`, resolveOptions);
      pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
    } catch (_) {
      // if there is no package.json we defer to regular resolve behavior
    }

    if (pkgJsonPath && pkgJson && pkgJson.exports) {
      try {
        const packageSubPath =
          pkgName === importPath ? '.' : `.${importPath.substring(pkgName.length)}`;
        const mappedSubPath = findEntrypointTopLevel(
          pkgJsonPath,
          packageSubPath,
          pkgJson.exports,
          exportConditions
        );
        const pkgDir = path.dirname(pkgJsonPath);
        location = path.join(pkgDir, mappedSubPath);
      } catch (error) {
        warn(error);
        return null;
      }
    }
  }

  if (!location) {
    location = await resolveImportPath(importPath, resolveOptions);
  }

  if (!preserveSymlinks) {
    if (await exists(location)) {
      location = await realpath(location);
    }
  }

  return {
    location,
    hasModuleSideEffects,
    hasPackageEntry,
    packageBrowserField,
    packageInfo
  };
}

// Resolve module specifiers in order. Promise resolves to the first module that resolves
// successfully, or the error that resulted from the last attempted module resolution.
export async function resolveImportSpecifiers({
  importSpecifierList,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories
}) {
  for (let i = 0; i < importSpecifierList.length; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await resolveId({
        importPath: importSpecifierList[i],
        exportConditions,
        warn,
        packageInfoCache,
        extensions,
        mainFields,
        preserveSymlinks,
        useBrowserOverrides,
        baseDir,
        moduleDirectories
      });
    } catch (error) {
      // swallow MODULE_NOT_FOUND errors
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }
  return null;
}