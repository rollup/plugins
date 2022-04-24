import { extname, relative } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import analyzeTopLevelStatements from './analyze-top-level-statements';
import { getDynamicRequireModules } from './dynamic-modules';

import getDynamicRequireModuleSet from './dynamic-require-paths';
import {
  DYNAMIC_MODULES_ID,
  ES_IMPORT_SUFFIX,
  EXPORTS_SUFFIX,
  EXTERNAL_SUFFIX,
  getHelpersModule,
  HELPERS_ID,
  isWrappedId,
  MODULE_SUFFIX,
  PROXY_SUFFIX,
  unwrapId
} from './helpers';
import { hasCjsKeywords } from './parse';
import { getEsImportProxy, getStaticRequireProxy, getUnknownRequireProxy } from './proxies';
import getResolveId from './resolve-id';
import { getResolveRequireSourcesAndGetMeta } from './resolve-require-sources';
import validateRollupVersion from './rollup-version';
import transformCommonjs from './transform-commonjs';
import { getName, getStrictRequiresFilter, normalizePathSlashes } from './utils';

export default function commonjs(options = {}) {
  const {
    ignoreGlobal,
    ignoreDynamicRequires,
    requireReturnsDefault: requireReturnsDefaultOption,
    defaultIsModuleExports: defaultIsModuleExportsOption,
    esmExternals
  } = options;
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const { strictRequiresFilter, detectCycles } = getStrictRequiresFilter(options);

  const getRequireReturnsDefault =
    typeof requireReturnsDefaultOption === 'function'
      ? requireReturnsDefaultOption
      : () => requireReturnsDefaultOption;

  let esmExternalIds;
  const isEsmExternal =
    typeof esmExternals === 'function'
      ? esmExternals
      : Array.isArray(esmExternals)
      ? ((esmExternalIds = new Set(esmExternals)), (id) => esmExternalIds.has(id))
      : () => esmExternals;

  const getDefaultIsModuleExports =
    typeof defaultIsModuleExportsOption === 'function'
      ? defaultIsModuleExportsOption
      : () =>
          typeof defaultIsModuleExportsOption === 'boolean' ? defaultIsModuleExportsOption : 'auto';

  const {
    resolveRequireSourcesAndGetMeta,
    getWrappedIds,
    isRequiredId
  } = getResolveRequireSourcesAndGetMeta(extensions, detectCycles);
  const dynamicRequireModuleSet = getDynamicRequireModuleSet(options.dynamicRequireTargets);
  const isDynamicRequireModulesEnabled = dynamicRequireModuleSet.size > 0;
  const commonDir = isDynamicRequireModulesEnabled
    ? getCommonDir(null, Array.from(dynamicRequireModuleSet).concat(process.cwd()))
    : null;

  const esModulesWithDefaultExport = new Set();
  const esModulesWithNamedExports = new Set();

  const ignoreRequire =
    typeof options.ignore === 'function'
      ? options.ignore
      : Array.isArray(options.ignore)
      ? (id) => options.ignore.includes(id)
      : () => false;

  const getIgnoreTryCatchRequireStatementMode = (id) => {
    const mode =
      typeof options.ignoreTryCatch === 'function'
        ? options.ignoreTryCatch(id)
        : Array.isArray(options.ignoreTryCatch)
        ? options.ignoreTryCatch.includes(id)
        : typeof options.ignoreTryCatch !== 'undefined'
        ? options.ignoreTryCatch
        : true;

    return {
      canConvertRequire: mode !== 'remove' && mode !== true,
      shouldRemoveRequireStatement: mode === 'remove'
    };
  };

  const resolveId = getResolveId(extensions);

  const sourceMap = options.sourceMap !== false;

  function transformAndCheckExports(code, id) {
    const { isEsModule, hasDefaultExport, hasNamedExports, ast } = analyzeTopLevelStatements(
      this.parse,
      code,
      id
    );
    if (hasDefaultExport) {
      esModulesWithDefaultExport.add(id);
    }
    if (hasNamedExports) {
      esModulesWithNamedExports.add(id);
    }

    if (
      !dynamicRequireModuleSet.has(normalizePathSlashes(id)) &&
      (!(hasCjsKeywords(code, ignoreGlobal) || isRequiredId(id)) ||
        (isEsModule && !options.transformMixedEsModules))
    ) {
      return { meta: { commonjs: { isCommonJS: false } } };
    }

    const needsRequireWrapper =
      !isEsModule &&
      (dynamicRequireModuleSet.has(normalizePathSlashes(id)) || strictRequiresFilter(id));

    return transformCommonjs(
      this.parse,
      code,
      id,
      isEsModule,
      ignoreGlobal || isEsModule,
      ignoreRequire,
      ignoreDynamicRequires && !isDynamicRequireModulesEnabled,
      getIgnoreTryCatchRequireStatementMode,
      sourceMap,
      isDynamicRequireModulesEnabled,
      dynamicRequireModuleSet,
      commonDir,
      ast,
      getDefaultIsModuleExports(id),
      needsRequireWrapper,
      resolveRequireSourcesAndGetMeta(this),
      isRequiredId(id)
    );
  }

  return {
    name: 'commonjs',

    options(options) {
      // Always sort the node-resolve plugin after the commonjs plugin as otherwise CommonJS entries
      // will not work with strictRequires: true
      const { plugins } = options;
      if (Array.isArray(plugins)) {
        const cjsIndex = plugins.findIndex((plugin) => plugin.name === 'commonjs');
        const nodeResolveIndex = plugins.findIndex((plugin) => plugin.name === 'node-resolve');
        if (nodeResolveIndex >= 0 && nodeResolveIndex < cjsIndex) {
          plugins.splice(cjsIndex + 1, 0, plugins[nodeResolveIndex]);
          plugins.splice(nodeResolveIndex, 1);
        }
      }
    },

    buildStart() {
      validateRollupVersion(this.meta.rollupVersion, peerDependencies.rollup);
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
      }
    },

    buildEnd() {
      if (options.strictRequires === 'debug') {
        const wrappedIds = getWrappedIds();
        if (wrappedIds.length) {
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: `The commonjs plugin automatically wrapped the following files:\n[\n${wrappedIds
              .map((id) => `\t${JSON.stringify(relative(process.cwd(), id))}`)
              .join(',\n')}\n]`
          });
        } else {
          // TODO Lukas test
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: 'The commonjs plugin did not wrap any files.'
          });
        }
      }
    },

    resolveId,

    load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule();
      }

      if (isWrappedId(id, MODULE_SUFFIX)) {
        const name = getName(unwrapId(id, MODULE_SUFFIX));
        return {
          code: `var ${name} = {exports: {}}; export {${name} as __module}`,
          syntheticNamedExports: '__module',
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (isWrappedId(id, EXPORTS_SUFFIX)) {
        const name = getName(unwrapId(id, EXPORTS_SUFFIX));
        return {
          code: `var ${name} = {}; export {${name} as __exports}`,
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (isWrappedId(id, EXTERNAL_SUFFIX)) {
        const actualId = unwrapId(id, EXTERNAL_SUFFIX);
        return getUnknownRequireProxy(
          actualId,
          isEsmExternal(actualId) ? getRequireReturnsDefault(actualId) : true
        );
      }

      if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
        return getEsImportProxy(unwrapId(id, ES_IMPORT_SUFFIX), defaultIsModuleExports);
      }

      if (id === DYNAMIC_MODULES_ID) {
        return getDynamicRequireModules(
          isDynamicRequireModulesEnabled,
          dynamicRequireModuleSet,
          commonDir,
          ignoreDynamicRequires
        );
      }

      if (isWrappedId(id, PROXY_SUFFIX)) {
        const actualId = unwrapId(id, PROXY_SUFFIX);
        return getStaticRequireProxy(
          actualId,
          getRequireReturnsDefault(actualId),
          esModulesWithDefaultExport,
          esModulesWithNamedExports,
          this.load
        );
      }

      return null;
    },

    transform(code, id) {
      const extName = extname(id);
      if (extName !== '.cjs' && (!filter(id) || !extensions.includes(extName))) {
        return null;
      }

      try {
        return transformAndCheckExports.call(this, code, id);
      } catch (err) {
        return this.error(err, err.loc);
      }
    }
  };
}
