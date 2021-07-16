/* eslint-disable no-param-reassign, no-shadow, no-undefined */
import { dirname, normalize, resolve, sep } from 'path';

import builtinList from 'builtin-modules';
import deepMerge from 'deepmerge';
import isModule from 'is-module';

import { isDirCached, isFileCached, readCachedFile } from './cache';
import { fileExists, readFile, realpath } from './fs';
import resolveImportSpecifiers from './resolveImportSpecifiers';
import { getMainFields, getPackageName, normalizeInput } from './util';
import handleDeprecatedOptions from './deprecated-options';

const builtins = new Set(builtinList);
const ES6_BROWSER_EMPTY = '\0node-resolve:empty.js';
const deepFreeze = (object) => {
  Object.freeze(object);

  for (const value of Object.values(object)) {
    if (typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return object;
};

const baseConditions = ['default', 'module'];
const baseConditionsEsm = [...baseConditions, 'import'];
const baseConditionsCjs = [...baseConditions, 'require'];
const defaults = {
  dedupe: [],
  // It's important that .mjs is listed before .js so that Rollup will interpret npm modules
  // which deploy both ESM .mjs and CommonJS .js files as ESM.
  extensions: ['.mjs', '.js', '.json', '.node'],
  resolveOnly: [],
  moduleDirectories: ['node_modules'],
  ignoreSideEffectsForRoot: false
};
export const DEFAULTS = deepFreeze(deepMerge({}, defaults));

export function nodeResolve(opts = {}) {
  const { warnings } = handleDeprecatedOptions(opts);

  const options = { ...defaults, ...opts };
  const { extensions, jail, moduleDirectories, ignoreSideEffectsForRoot } = options;
  const conditionsEsm = [...baseConditionsEsm, ...(options.exportConditions || [])];
  const conditionsCjs = [...baseConditionsCjs, ...(options.exportConditions || [])];
  const packageInfoCache = new Map();
  const idToPackageInfo = new Map();
  const mainFields = getMainFields(options);
  const useBrowserOverrides = mainFields.indexOf('browser') !== -1;
  const isPreferBuiltinsSet = options.preferBuiltins === true || options.preferBuiltins === false;
  const preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
  const rootDir = resolve(options.rootDir || process.cwd());
  let { dedupe } = options;
  let rollupOptions;

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

  const doResolveId = async (context, importee, importer, opts) => {
    // strip query params from import
    const [importPath, params] = importee.split('?');
    const importSuffix = `${params ? `?${params}` : ''}`;
    importee = importPath;

    const baseDir = !importer || dedupe(importee) ? rootDir : dirname(importer);

    // https://github.com/defunctzombie/package-browser-field-spec
    const browser = browserMapCache.get(importer);
    if (useBrowserOverrides && browser) {
      const resolvedImportee = resolve(baseDir, importee);
      if (browser[importee] === false || browser[resolvedImportee] === false) {
        return { id: ES6_BROWSER_EMPTY };
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
      id = resolve(baseDir, importee);
      isRelativeImport = true;
    }

    if (
      !isRelativeImport &&
      resolveOnly.length &&
      !resolveOnly.some((pattern) => pattern.test(id))
    ) {
      if (normalizeInput(rollupOptions.input).includes(importee)) {
        return null;
      }
      return false;
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

    if (importeeIsBuiltin) {
      // The `resolve` library will not resolve packages with the same
      // name as a node built-in module. If we're resolving something
      // that's a builtin, and we don't prefer to find built-ins, we
      // first try to look up a local module with that name. If we don't
      // find anything, we resolve the builtin which just returns back
      // the built-in's name.
      importSpecifierList.push(`${importee}/`);
    }

    // TypeScript files may import '.js' to refer to either '.ts' or '.tsx'
    if (importer && importee.endsWith('.js')) {
      for (const ext of ['.ts', '.tsx']) {
        if (importer.endsWith(ext) && extensions.includes(ext)) {
          importSpecifierList.push(importee.replace(/.js$/, ext));
        }
      }
    }

    importSpecifierList.push(importee);

    const warn = (...args) => context.warn(...args);
    const isRequire =
      opts && opts.custom && opts.custom['node-resolve'] && opts.custom['node-resolve'].isRequire;
    const exportConditions = isRequire ? conditionsCjs : conditionsEsm;

    if (useBrowserOverrides && !exportConditions.includes('browser'))
      exportConditions.push('browser');

    const resolvedWithoutBuiltins = await resolveImportSpecifiers({
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
    });

    const resolved =
      importeeIsBuiltin && preferBuiltins
        ? {
            packageInfo: undefined,
            hasModuleSideEffects: () => null,
            hasPackageEntry: true,
            packageBrowserField: false
          }
        : resolvedWithoutBuiltins;
    if (!resolved) {
      return null;
    }

    const { packageInfo, hasModuleSideEffects, hasPackageEntry, packageBrowserField } = resolved;
    let { location } = resolved;
    if (packageBrowserField) {
      if (Object.prototype.hasOwnProperty.call(packageBrowserField, location)) {
        if (!packageBrowserField[location]) {
          browserMapCache.set(location, packageBrowserField);
          return { id: ES6_BROWSER_EMPTY };
        }
        location = packageBrowserField[location];
      }
      browserMapCache.set(location, packageBrowserField);
    }

    if (hasPackageEntry && !preserveSymlinks) {
      const exists = await fileExists(location);
      if (exists) {
        location = await realpath(location);
      }
    }

    idToPackageInfo.set(location, packageInfo);

    if (hasPackageEntry) {
      if (importeeIsBuiltin && preferBuiltins) {
        if (!isPreferBuiltinsSet && resolvedWithoutBuiltins && resolved !== importee) {
          context.warn(
            `preferring built-in module '${importee}' over local alternative at '${resolvedWithoutBuiltins.location}', pass 'preferBuiltins: false' to disable this behavior or 'preferBuiltins: true' to disable this warning`
          );
        }
        return false;
      } else if (jail && location.indexOf(normalize(jail.trim(sep))) !== 0) {
        return null;
      }
    }

    if (options.modulesOnly && (await fileExists(location))) {
      const code = await readFile(location, 'utf-8');
      if (isModule(code)) {
        return {
          id: `${location}${importSuffix}`,
          moduleSideEffects: hasModuleSideEffects(location)
        };
      }
      return null;
    }
    const result = {
      id: `${location}${importSuffix}`,
      moduleSideEffects: hasModuleSideEffects(location)
    };
    return result;
  };

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

    async resolveId(importee, importer, opts) {
      if (importee === ES6_BROWSER_EMPTY) {
        return importee;
      }
      // ignore IDs with null character, these belong to other plugins
      if (/\0/.test(importee)) return null;

      if (/\0/.test(importer)) {
        importer = undefined;
      }

      const resolved = await doResolveId(this, importee, importer, opts);
      if (resolved) {
        const resolvedResolved = await this.resolve(resolved.id, importer, { skipSelf: true });
        const isExternal = !!(resolvedResolved && resolvedResolved.external);
        if (isExternal) {
          return false;
        }
      }
      return resolved;
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
