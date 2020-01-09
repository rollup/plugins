import { dirname, extname, resolve } from 'path';

import { createFilter } from '@rollup/pluginutils';

import { readFile, realpathSync, stat } from './fs';

const callback = (err) => {
  if (err.code === 'ENOENT') return false;
  throw err;
};

const makeCache = (fn) => {
  const result = new Map();
  const wrapped = (param, done) => {
    if (result.has(param) === false) {
      result.set(
        param,
        fn(param).catch((err) => {
          result.delete(param);
          throw err;
        })
      );
    }
    return result.get(param).then((value) => done(null, value), done);
  };
  wrapped.clear = () => result.clear();
  return wrapped;
};

export const isDirCached = makeCache((file) => stat(file).then((s) => s.isDirectory(), callback));

export const isFileCached = makeCache((file) => stat(file).then((s) => s.isFile(), callback));

export const readCachedFile = makeCache(readFile);

export function getPackageInfo(options) {
  const { cache, extensions, pkg, mainFields, preserveSymlinks, useBrowserOverrides } = options;
  let { pkgPath } = options;

  if (cache.has(pkgPath)) {
    return cache.get(pkgPath);
  }

  // browserify/resolve doesn't realpath paths returned in its packageFilter callback
  if (!preserveSymlinks) {
    pkgPath = realpathSync(pkgPath);
  }

  const pkgRoot = dirname(pkgPath);

  const packageInfo = {
    // copy as we are about to munge the `main` field of `pkg`.
    packageJson: Object.assign({}, pkg),

    // path to package.json file
    packageJsonPath: pkgPath,

    // directory containing the package.json
    root: pkgRoot,

    // which main field was used during resolution of this module (main, module, or browser)
    resolvedMainField: 'main',

    // whether the browser map was used to resolve the entry point to this module
    browserMappedMain: false,

    // the entry point of the module with respect to the selected main field and any
    // relevant browser mappings.
    resolvedEntryPoint: ''
  };

  let overriddenMain = false;
  for (let i = 0; i < mainFields.length; i++) {
    const field = mainFields[i];
    if (typeof pkg[field] === 'string') {
      pkg.main = pkg[field];
      packageInfo.resolvedMainField = field;
      overriddenMain = true;
      break;
    }
  }

  const internalPackageInfo = {
    cachedPkg: pkg,
    hasModuleSideEffects: () => null,
    hasPackageEntry: overriddenMain !== false || mainFields.indexOf('main') !== -1,
    packageBrowserField:
      useBrowserOverrides &&
      typeof pkg.browser === 'object' &&
      Object.keys(pkg.browser).reduce((browser, key) => {
        let resolved = pkg.browser[key];
        if (resolved && resolved[0] === '.') {
          resolved = resolve(pkgRoot, resolved);
        }
        /* eslint-disable no-param-reassign */
        browser[key] = resolved;
        if (key[0] === '.') {
          const absoluteKey = resolve(pkgRoot, key);
          browser[absoluteKey] = resolved;
          if (!extname(key)) {
            extensions.reduce((subBrowser, ext) => {
              subBrowser[absoluteKey + ext] = subBrowser[key];
              return subBrowser;
            }, browser);
          }
        }
        return browser;
      }, {}),
    packageInfo
  };

  const browserMap = internalPackageInfo.packageBrowserField;
  if (
    useBrowserOverrides &&
    typeof pkg.browser === 'object' &&
    // eslint-disable-next-line no-prototype-builtins
    browserMap.hasOwnProperty(pkg.main)
  ) {
    packageInfo.resolvedEntryPoint = browserMap[pkg.main];
    packageInfo.browserMappedMain = true;
  } else {
    // index.node is technically a valid default entrypoint as well...
    packageInfo.resolvedEntryPoint = resolve(pkgRoot, pkg.main || 'index.js');
    packageInfo.browserMappedMain = false;
  }

  const packageSideEffects = pkg.sideEffects;
  if (typeof packageSideEffects === 'boolean') {
    internalPackageInfo.hasModuleSideEffects = () => packageSideEffects;
  } else if (Array.isArray(packageSideEffects)) {
    internalPackageInfo.hasModuleSideEffects = createFilter(packageSideEffects, null, {
      resolve: pkgRoot
    });
  }

  cache.set(pkgPath, internalPackageInfo);
  return internalPackageInfo;
}
