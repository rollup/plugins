import fs from 'fs';
import { promisify } from 'util';
import { fileURLToPath, pathToFileURL } from 'url';

import resolve from 'resolve';

import { getPackageInfo, getPackageName } from './util';
import { exists, realpath } from './fs';
import { isDirCached, isFileCached, readCachedFile } from './cache';
import resolvePackageExports from './package/resolvePackageExports';
import resolvePackageImports from './package/resolvePackageImports';
import { ResolveError } from './package/utils';

const resolveImportPath = promisify(resolve);
const readFile = promisify(fs.readFile);

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
    // this is a bare import, resolve using package exports if possible
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
        const subpath =
          pkgName === importSpecifier ? '.' : `.${importSpecifier.substring(pkgName.length)}`;
        const pkgDr = pkgJsonPath.replace('package.json', '');
        const pkgURL = pathToFileURL(pkgDr);
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
        if (!(error instanceof ResolveError)) {
          throw error;
        }
        warn(error);
        return null;
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
  moduleDirectories
}) {
  for (let i = 0; i < importSpecifierList.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    const resolved = await resolveId({
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
      moduleDirectories
    });
    if (resolved) {
      return resolved;
    }
  }
  return null;
}
