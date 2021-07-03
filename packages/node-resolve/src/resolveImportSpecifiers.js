import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath, pathToFileURL } from 'url';

import { dirname } from 'path';

import resolve from 'resolve';

import { getPackageInfo, getPackageName } from './util';
import { fileExists, realpath } from './fs';
import { isDirCached, isFileCached, readCachedFile } from './cache';
import resolvePackageExports from './package/resolvePackageExports';
import resolvePackageImports from './package/resolvePackageImports';
import { findPackageJson, ResolveError } from './package/utils';

const resolveImportPath = promisify(resolve);
const readFile = promisify(fs.readFile);

async function getPackageJson(importer, pkgName, resolveOptions, moduleDirectories) {
  if (importer) {
    const selfPackageJsonResult = await findPackageJson(importer, moduleDirectories);
    if (selfPackageJsonResult && selfPackageJsonResult.pkgJson.name === pkgName) {
      // the referenced package name is the current package
      return selfPackageJsonResult;
    }
  }

  try {
    const pkgJsonPath = await resolveImportPath(`${pkgName}/package.json`, resolveOptions);
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf-8'));
    return { pkgJsonPath, pkgJson, pkgPath: dirname(pkgJsonPath) };
  } catch (_) {
    return null;
  }
}

async function resolveId({
  importer,
  importSpecifier,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  rootDir,
  ignoreSideEffectsForRoot
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
      useBrowserOverrides,
      rootDir,
      ignoreSideEffectsForRoot
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

  const pkgName = getPackageName(importSpecifier);
  if (importSpecifier.startsWith('#')) {
    // this is a package internal import, resolve using package imports field
    const resolveResult = await resolvePackageImports({
      importSpecifier,
      importer,
      moduleDirs: moduleDirectories,
      conditions: exportConditions,
      resolveId(id, parent) {
        return resolveId({
          importSpecifier: id,
          importer: parent,
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
      }
    });
    location = fileURLToPath(resolveResult);
  } else if (pkgName) {
    // it's a bare import, find the package.json and resolve using package exports if available
    const result = await getPackageJson(importer, pkgName, resolveOptions, moduleDirectories);

    if (result && result.pkgJson.exports) {
      const { pkgJson, pkgJsonPath, pkgPath } = result;
      try {
        const subpath =
          pkgName === importSpecifier ? '.' : `.${importSpecifier.substring(pkgName.length)}`;
        const pkgURL = pathToFileURL(`${pkgPath}/`);

        const context = {
          importer,
          importSpecifier,
          moduleDirs: moduleDirectories,
          pkgURL,
          pkgJsonPath,
          conditions: exportConditions
        };
        const resolvedPackageExport = await resolvePackageExports(
          context,
          subpath,
          pkgJson.exports
        );
        location = fileURLToPath(resolvedPackageExport);
      } catch (error) {
        if (error instanceof ResolveError) {
          return error;
        }
        throw error;
      }
    }
  }

  if (!location) {
    // package has no imports or exports, use classic node resolve
    try {
      location = await resolveImportPath(importSpecifier, resolveOptions);
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      return null;
    }
  }

  if (!preserveSymlinks) {
    if (await fileExists(location)) {
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
export default async function resolveImportSpecifiers({
  importer,
  importSpecifierList,
  exportConditions,
  warn,
  packageInfoCache,
  extensions,
  mainFields,
  preserveSymlinks,
  useBrowserOverrides,
  baseDir,
  moduleDirectories,
  rootDir,
  ignoreSideEffectsForRoot
}) {
  let lastResolveError;

  for (let i = 0; i < importSpecifierList.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const result = await resolveId({
      importer,
      importSpecifier: importSpecifierList[i],
      exportConditions,
      warn,
      packageInfoCache,
      extensions,
      mainFields,
      preserveSymlinks,
      useBrowserOverrides,
      baseDir,
      moduleDirectories,
      rootDir,
      ignoreSideEffectsForRoot
    });

    if (result instanceof ResolveError) {
      lastResolveError = result;
    } else if (result) {
      return result;
    }
  }

  if (lastResolveError) {
    // only log the last failed resolve error
    warn(lastResolveError);
  }
  return null;
}
