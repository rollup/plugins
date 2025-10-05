import { dirname, extname, relative, resolve } from 'path';

import { createFilter } from '@rollup/pluginutils';

import { peerDependencies, version } from '../package.json';

import analyzeTopLevelStatements from './analyze-top-level-statements';
import { getDynamicModuleRegistry, getDynamicRequireModules } from './dynamic-modules';

import {
  DYNAMIC_MODULES_ID,
  ENTRY_SUFFIX,
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
import {
  getEntryProxy,
  getEsImportProxy,
  getStaticRequireProxy,
  getUnknownRequireProxy
} from './proxies';
import getResolveId from './resolve-id';
import { getRequireResolver } from './resolve-require-sources';
import validateVersion from './rollup-version';
import transformCommonjs from './transform-commonjs';
import { getName, getStrictRequiresFilter, normalizePathSlashes } from './utils';

const PLUGIN_NAME = 'commonjs';

export function commonjs(options = {}) {
  const {
    ignoreGlobal,
    ignoreDynamicRequires,
    requireReturnsDefault: requireReturnsDefaultOption,
    defaultIsModuleExports: defaultIsModuleExportsOption,
    esmExternals
  } = options;
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const isPossibleCjsId = (id) => {
    const extName = extname(id);
    return extName === '.cjs' || (extensions.includes(extName) && filter(id));
  };

  const { strictRequiresFilter, detectCyclesAndConditional } = getStrictRequiresFilter(options);

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

  const dynamicRequireRoot =
    typeof options.dynamicRequireRoot === 'string'
      ? resolve(options.dynamicRequireRoot)
      : process.cwd();
  const { commonDir, dynamicRequireModules } = getDynamicRequireModules(
    options.dynamicRequireTargets,
    dynamicRequireRoot
  );
  const isDynamicRequireModulesEnabled = dynamicRequireModules.size > 0;

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
      shouldRemoveRequire: mode === 'remove'
    };
  };

  const { currentlyResolving, resolveId } = getResolveId(extensions, isPossibleCjsId);

  const sourceMap = options.sourceMap !== false;

  // Initialized in buildStart
  let requireResolver;

  function transformAndCheckExports(code, id) {
    const normalizedId = normalizePathSlashes(id);
    const { isEsModule, hasDefaultExport, hasNamedExports, ast } = analyzeTopLevelStatements(
      this.parse,
      code,
      id
    );

    const commonjsMeta = this.getModuleInfo(id).meta.commonjs || {};
    if (hasDefaultExport) {
      commonjsMeta.hasDefaultExport = true;
    }
    if (hasNamedExports) {
      commonjsMeta.hasNamedExports = true;
    }

    if (
      !dynamicRequireModules.has(normalizedId) &&
      (!(hasCjsKeywords(code, ignoreGlobal) || requireResolver.isRequiredId(id)) ||
        (isEsModule && !options.transformMixedEsModules))
    ) {
      commonjsMeta.isCommonJS = false;
      return { meta: { commonjs: commonjsMeta } };
    }

    const needsRequireWrapper =
      !isEsModule && (dynamicRequireModules.has(normalizedId) || strictRequiresFilter(id));

    const checkDynamicRequire = (position) => {
      const normalizedDynamicRequireRoot = normalizePathSlashes(dynamicRequireRoot);

      if (normalizedId.indexOf(normalizedDynamicRequireRoot) !== 0) {
        this.error(
          {
            code: 'DYNAMIC_REQUIRE_OUTSIDE_ROOT',
            normalizedId,
            normalizedDynamicRequireRoot,
            message: `"${normalizedId}" contains dynamic require statements but it is not within the current dynamicRequireRoot "${normalizedDynamicRequireRoot}". You should set dynamicRequireRoot to "${dirname(
              normalizedId
            )}" or one of its parent directories.`
          },
          position
        );
      }
    };

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
      dynamicRequireModules,
      commonDir,
      ast,
      getDefaultIsModuleExports(id),
      needsRequireWrapper,
      requireResolver.resolveRequireSourcesAndUpdateMeta(this),
      requireResolver.isRequiredId(id),
      checkDynamicRequire,
      commonjsMeta
    );
  }

  return {
    name: PLUGIN_NAME,

    version,

    options(rawOptions) {
      // We inject the resolver in the beginning so that "catch-all-resolver" like node-resolver
      // do not prevent our plugin from resolving entry points ot proxies.
      const plugins = Array.isArray(rawOptions.plugins)
        ? [...rawOptions.plugins]
        : rawOptions.plugins
        ? [rawOptions.plugins]
        : [];
      plugins.unshift({
        name: 'commonjs--resolver',
        resolveId
      });
      return { ...rawOptions, plugins };
    },

    buildStart({ plugins }) {
      validateVersion(this.meta.rollupVersion, peerDependencies.rollup, 'rollup');
      const nodeResolve = plugins.find(({ name }) => name === 'node-resolve');
      if (nodeResolve) {
        validateVersion(nodeResolve.version, '^13.0.6', '@rollup/plugin-node-resolve');
      }
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
      }
      requireResolver = getRequireResolver(
        extensions,
        detectCyclesAndConditional,
        currentlyResolving
      );
    },

    buildEnd() {
      if (options.strictRequires === 'debug') {
        const wrappedIds = requireResolver.getWrappedIds();
        if (wrappedIds.length) {
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: `The commonjs plugin automatically wrapped the following files:\n[\n${wrappedIds
              .map((id) => `\t${JSON.stringify(relative(process.cwd(), id))}`)
              .join(',\n')}\n]`
          });
        } else {
          this.warn({
            code: 'WRAPPED_IDS',
            ids: wrappedIds,
            message: 'The commonjs plugin did not wrap any files.'
          });
        }
      }
    },

    async load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule();
      }

      if (isWrappedId(id, MODULE_SUFFIX)) {
        const name = getName(unwrapId(id, MODULE_SUFFIX));
        return {
          code: `var ${name} = {exports: {}}; export {${name} as __module}`,
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

      // entry suffix is just appended to not mess up relative external resolution
      if (id.endsWith(ENTRY_SUFFIX)) {
        const acutalId = id.slice(0, -ENTRY_SUFFIX.length);
        const {
          meta: { commonjs: commonjsMeta }
        } = this.getModuleInfo(acutalId);
        const shebang = commonjsMeta?.shebang ?? '';
        return getEntryProxy(
          acutalId,
          getDefaultIsModuleExports(acutalId),
          this.getModuleInfo,
          shebang
        );
      }

      if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
        const actualId = unwrapId(id, ES_IMPORT_SUFFIX);
        return getEsImportProxy(
          actualId,
          getDefaultIsModuleExports(actualId),
          (await this.load({ id: actualId })).moduleSideEffects
        );
      }

      if (id === DYNAMIC_MODULES_ID) {
        return getDynamicModuleRegistry(
          isDynamicRequireModulesEnabled,
          dynamicRequireModules,
          commonDir,
          ignoreDynamicRequires
        );
      }

      if (isWrappedId(id, PROXY_SUFFIX)) {
        const actualId = unwrapId(id, PROXY_SUFFIX);
        return getStaticRequireProxy(actualId, getRequireReturnsDefault(actualId), this.load);
      }

      return null;
    },

    shouldTransformCachedModule(...args) {
      return requireResolver.shouldTransformCachedModule.call(this, ...args);
    },

    transform(code, id) {
      if (!isPossibleCjsId(id)) return null;

      try {
        return transformAndCheckExports.call(this, code, id);
      } catch (err) {
        return this.error(err, err.pos);
      }
    }
  };
}
export default commonjs;
