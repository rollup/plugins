import { dirname, extname, resolve } from 'path';
import { promisify } from 'util';

import { createFilter } from '@rollup/pluginutils';

import resolveModule from 'resolve';

import { realpathSync } from './fs';

const resolveId = promisify(resolveModule);

// returns the imported package name for bare module imports
export function getPackageName(id) {
  if (id.startsWith('.') || id.startsWith('/')) {
    return null;
  }

  const split = id.split('/');

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === '@') {
    return `${split[0]}/${split[1]}`;
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return split[0];
}

export function getMainFields(options) {
  let mainFields;
  if (options.mainFields) {
    ({ mainFields } = options);
  } else {
    mainFields = ['module', 'main'];
  }
  if (options.browser && mainFields.indexOf('browser') === -1) {
    return ['browser'].concat(mainFields);
  }
  if (!mainFields.length) {
    throw new Error('Please ensure at least one `mainFields` value is specified');
  }
  return mainFields;
}

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

export function normalizeInput(input) {
  if (Array.isArray(input)) {
    return input;
  } else if (typeof input === 'object') {
    return Object.values(input);
  }

  // otherwise it's a string
  return [input];
}

// Resolve module specifiers in order. Promise resolves to the first module that resolves
// successfully, or the error that resulted from the last attempted module resolution.
export function resolveImportSpecifiers(importSpecifierList, resolveOptions) {
  let promise = Promise.resolve();

  for (let i = 0; i < importSpecifierList.length; i++) {
    promise = promise.then((value) => {
      // if we've already resolved to something, just return it.
      if (value) {
        return value;
      }

      return resolveId(importSpecifierList[i], resolveOptions).then((result) => {
        if (!resolveOptions.preserveSymlinks) {
          try {
            result = realpathSync(result);
          } catch (e) {
            // maybe the file does not exist. Might be a builtin
          }
        }
        return result;
      });
    });

    // swallow MODULE_NOT_FOUND errors
    promise = promise.catch((error) => {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    });
  }

  return promise;
}
