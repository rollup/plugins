import { extname } from 'path';

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
  unwrapId,
  wrapId
} from './helpers';
import { hasCjsKeywords } from './parse';
import { getStaticRequireProxy, getUnknownRequireProxy } from './proxies';
import getResolveId, { resolveExtensions } from './resolve-id';
import validateRollupVersion from './rollup-version';
import transformCommonjs from './transform-commonjs';
import { capitalize, getName, normalizePathSlashes } from './utils';

export default function commonjs(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const strictRequireSemanticFilter =
    options.strictRequireSemantic === true
      ? () => true
      : !options.strictRequireSemantic
      ? () => false
      : createFilter(options.strictRequireSemantic);
  const {
    ignoreGlobal,
    ignoreDynamicRequires,
    requireReturnsDefault: requireReturnsDefaultOption,
    esmExternals
  } = options;
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
  const defaultIsModuleExports =
    typeof options.defaultIsModuleExports === 'boolean' ? options.defaultIsModuleExports : 'auto';
  const knownCjsModuleTypes = Object.create(null);

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
      (!hasCjsKeywords(code, ignoreGlobal) || (isEsModule && !options.transformMixedEsModules))
    ) {
      return { meta: { commonjs: { isCommonJS: false } } };
    }

    // TODO Lukas
    // * test import from ESM -> additional proxy
    // * test entry point
    // * test interaction with dynamic require targets
    // * test circular dependency: We must not use this.load without circularity check -> error in Rollup?
    // When we write the imports, we already know that we are commonjs or mixed so we can rely on usesRequireWrapper and write that into a table
    const usesRequireWrapper =
      !isEsModule &&
      (dynamicRequireModuleSet.has(normalizePathSlashes(id)) || strictRequireSemanticFilter(id));

    // TODO Lukas extract helpers
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
      defaultIsModuleExports,
      usesRequireWrapper,
      // TODO Lukas extract
      (isParentCommonJS, sources) => {
        knownCjsModuleTypes[id] = isParentCommonJS;
        return Promise.all(
          sources.map(async (source) => {
            // Never analyze or proxy internal modules
            if (source.startsWith('\0')) {
              return { source, id: source, isCommonJS: false };
            }
            const resolved =
              (await this.resolve(source, id, {
                skipSelf: true,
                custom: {
                  'node-resolve': { isRequire: true }
                }
              })) || resolveExtensions(source, id, extensions);
            if (!resolved) {
              return { source, id: wrapId(source, EXTERNAL_SUFFIX), isCommonJS: false };
            }
            if (resolved.external) {
              return { source, id: wrapId(resolved.id, EXTERNAL_SUFFIX), isCommonJS: false };
            }
            if (resolved.id in knownCjsModuleTypes) {
              return {
                source,
                id:
                  knownCjsModuleTypes[resolved.id] === true
                    ? wrapId(resolved.id, PROXY_SUFFIX)
                    : resolved.id,
                isCommonJS: knownCjsModuleTypes[resolved.id]
              };
            }
            const {
              meta: { commonjs: commonjsMeta }
            } = await this.load(resolved);
            const isCommonJS = commonjsMeta && commonjsMeta.isCommonJS;
            return {
              source,
              id:
                // TODO Lukas extract constant
                isCommonJS === 'withRequireFunction'
                  ? resolved.id
                  : wrapId(resolved.id, PROXY_SUFFIX),
              isCommonJS
            };
          })
        );
      }
    );
  }

  return {
    name: 'commonjs',

    buildStart() {
      validateRollupVersion(this.meta.rollupVersion, peerDependencies.rollup);
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
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

      // TODO Lukas extract
      if (isWrappedId(id, ES_IMPORT_SUFFIX)) {
        const actualId = unwrapId(id, ES_IMPORT_SUFFIX);
        const name = getName(actualId);
        const exportsName = `${name}Exports`;
        const requireModule = `require${capitalize(name)}`;
        // TODO Lukas the ES wrapper might also just forward the exports object
        let code =
          `import { getDefaultExportFromCjs } from "${HELPERS_ID}";\n` +
          `import { __require as ${requireModule} } from ${JSON.stringify(actualId)};\n` +
          `var ${exportsName} = ${requireModule}();\n` +
          `export { ${exportsName} as __moduleExports };`;
        if (defaultIsModuleExports) {
          code += `\nexport { ${exportsName} as default };`;
        } else {
          code += `export default /*@__PURE__*/getDefaultExportFromCjs(${exportsName});`;
        }
        return {
          code,
          syntheticNamedExports: '__moduleExports',
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (id === DYNAMIC_MODULES_ID) {
        return {
          code: getDynamicRequireModules(
            isDynamicRequireModulesEnabled,
            dynamicRequireModuleSet,
            commonDir,
            ignoreDynamicRequires
          ),
          meta: { commonjs: { isCommonJS: false } }
        };
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
