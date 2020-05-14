/* eslint-disable no-param-reassign, no-shadow, no-undefined */
import { dirname, normalize, resolve, sep } from 'path';

import builtinList from 'builtin-modules';
import deepFreeze from 'deep-freeze';
import deepMerge from 'deepmerge';
import isModule from 'is-module';

import { isDirCached, isFileCached, readCachedFile } from './cache';
import { exists, readFile, realpath } from './fs';
import {
  getMainFields,
  getPackageInfo,
  getPackageName,
  normalizeInput,
  resolveImportSpecifiers
} from './util';

const builtins = new Set(builtinList);
const ES6_BROWSER_EMPTY = '\0node-resolve:empty.js';
const nullFn = () => null;
const defaults = {
  customResolveOptions: {},
  dedupe: [],
  // It's important that .mjs is listed before .js so that Rollup will interpret npm modules
  // which deploy both ESM .mjs and CommonJS .js files as ESM.
  extensions: ['.mjs', '.js', '.json', '.node'],
  resolveOnly: []
};
export const DEFAULTS = deepFreeze(deepMerge({}, defaults));

export function nodeResolve(opts = {}) {
  const options = Object.assign({}, defaults, opts);
  const { customResolveOptions, extensions, jail } = options;
  const warnings = [];
  const packageInfoCache = new Map();
  const idToPackageInfo = new Map();
  const mainFields = getMainFields(options);
  const useBrowserOverrides = mainFields.indexOf('browser') !== -1;
  const isPreferBuiltinsSet = options.preferBuiltins === true || options.preferBuiltins === false;
  const preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
  const rootDir = options.rootDir || process.cwd();
  let { dedupe } = options;
  let rollupOptions;

  if (options.only) {
    warnings.push('node-resolve: The `only` options is deprecated, please use `resolveOnly`');
    options.resolveOnly = options.only;
  }

  if (typeof dedupe !== 'function') {
    dedupe = (importee) =>
      options.dedupe.includes(importee) || options.dedupe.includes(getPackageName(importee));
  }

  const resolveOnly = options.resolveOnly.map((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern;
    }
    const normalized = pattern.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`^${normalized}$`);
  });

  const browserMapCache = new Map();
  let preserveSymlinks;

  return {
    name: 'node-resolve',

    buildStart(options) {
      rollupOptions = options;

      for (const warning of warnings) {
        this.warn(warning);
      }

      ({ preserveSymlinks } = options);
    },

    generateBundle() {
      readCachedFile.clear();
      isFileCached.clear();
      isDirCached.clear();
    },

    async resolveId(importee, importer) {
      if (importee === ES6_BROWSER_EMPTY) {
        return importee;
      }
      // ignore IDs with null character, these belong to other plugins
      if (/\0/.test(importee)) return null;

      const basedir = !importer || dedupe(importee) ? rootDir : dirname(importer);

      // https://github.com/defunctzombie/package-browser-field-spec
      const browser = browserMapCache.get(importer);
      if (useBrowserOverrides && browser) {
        const resolvedImportee = resolve(basedir, importee);
        if (browser[importee] === false || browser[resolvedImportee] === false) {
          return ES6_BROWSER_EMPTY;
        }
        const browserImportee =
          browser[importee] ||
          browser[resolvedImportee] ||
          browser[`${resolvedImportee}.js`] ||
          browser[`${resolvedImportee}.json`];
        if (browserImportee) {
          importee = browserImportee;
        }
      }

      const parts = importee.split(/[/\\]/);
      let id = parts.shift();
      let isRelativeImport = false;

      if (id[0] === '@' && parts.length > 0) {
        // scoped packages
        id += `/${parts.shift()}`;
      } else if (id[0] === '.') {
        // an import relative to the parent dir of the importer
        id = resolve(basedir, importee);
        isRelativeImport = true;
      }

      const input = normalizeInput(rollupOptions.input);
      if (
        !isRelativeImport &&
        resolveOnly.length &&
        !resolveOnly.some((pattern) => pattern.test(id))
      ) {
        if (input.includes(id)) {
          return null;
        }
        return false;
      }

      let hasModuleSideEffects = nullFn;
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

      let resolveOptions = {
        basedir,
        packageFilter: filter,
        readFile: readCachedFile,
        isFile: isFileCached,
        isDirectory: isDirCached,
        extensions
      };

      if (preserveSymlinks !== undefined) {
        resolveOptions.preserveSymlinks = preserveSymlinks;
      }

      const importSpecifierList = [];

      if (importer === undefined && !importee[0].match(/^\.?\.?\//)) {
        // For module graph roots (i.e. when importer is undefined), we
        // need to handle 'path fragments` like `foo/bar` that are commonly
        // found in rollup config files. If importee doesn't look like a
        // relative or absolute path, we make it relative and attempt to
        // resolve it. If we don't find anything, we try resolving it as we
        // got it.
        importSpecifierList.push(`./${importee}`);
      }

      const importeeIsBuiltin = builtins.has(importee);

      if (importeeIsBuiltin && (!preferBuiltins || !isPreferBuiltinsSet)) {
        // The `resolve` library will not resolve packages with the same
        // name as a node built-in module. If we're resolving something
        // that's a builtin, and we don't prefer to find built-ins, we
        // first try to look up a local module with that name. If we don't
        // find anything, we resolve the builtin which just returns back
        // the built-in's name.
        importSpecifierList.push(`${importee}/`);
      }

      importSpecifierList.push(importee);
      resolveOptions = Object.assign(resolveOptions, customResolveOptions);

      try {
        let resolved = await resolveImportSpecifiers(importSpecifierList, resolveOptions);

        if (resolved && packageBrowserField) {
          if (Object.prototype.hasOwnProperty.call(packageBrowserField, resolved)) {
            if (!packageBrowserField[resolved]) {
              browserMapCache.set(resolved, packageBrowserField);
              return ES6_BROWSER_EMPTY;
            }
            resolved = packageBrowserField[resolved];
          }
          browserMapCache.set(resolved, packageBrowserField);
        }

        if (hasPackageEntry && !preserveSymlinks && resolved) {
          const fileExists = await exists(resolved);
          if (fileExists) {
            resolved = await realpath(resolved);
          }
        }

        idToPackageInfo.set(resolved, packageInfo);

        if (hasPackageEntry) {
          if (builtins.has(resolved) && preferBuiltins && isPreferBuiltinsSet) {
            return null;
          } else if (importeeIsBuiltin && preferBuiltins) {
            if (!isPreferBuiltinsSet) {
              this.warn(
                `preferring built-in module '${importee}' over local alternative at '${resolved}', pass 'preferBuiltins: false' to disable this behavior or 'preferBuiltins: true' to disable this warning`
              );
            }
            return null;
          } else if (jail && resolved.indexOf(normalize(jail.trim(sep))) !== 0) {
            return null;
          }
        }

        if (resolved && options.modulesOnly) {
          const code = await readFile(resolved, 'utf-8');
          if (isModule(code)) {
            return { id: resolved, moduleSideEffects: hasModuleSideEffects(resolved) };
          }
          return null;
        }
        const result = { id: resolved, moduleSideEffects: hasModuleSideEffects(resolved) };
        return result;
      } catch (error) {
        return null;
      }
    },

    load(importee) {
      if (importee === ES6_BROWSER_EMPTY) {
        return 'export default {};';
      }
      return null;
    },

    getPackageInfoForId(id) {
      return idToPackageInfo.get(id);
    }
  };
}

export default nodeResolve;
