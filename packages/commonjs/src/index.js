import { dirname, extname } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import analyzeTopLevelStatements from './analyze-top-level-statements';

import {
  getDynamicPackagesEntryIntro,
  getDynamicPackagesModule,
  isDynamicModuleImport
} from './dynamic-packages-manager';
import getDynamicRequirePaths from './dynamic-require-paths';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_SUFFIX,
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
  getDynamicJsonProxy,
  getDynamicRequireProxy,
  getSpecificHelperProxy,
  getStaticRequireProxy,
  getUnknownRequireProxy
} from './proxies';
import getResolveId from './resolve-id';
import validateRollupVersion from './rollup-version';
import transformCommonjs from './transform-commonjs';
import { getName, getVirtualPathForDynamicRequirePath, normalizePathSlashes } from './utils';

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

  const { dynamicRequireModuleSet, dynamicRequireModuleDirPaths } = getDynamicRequirePaths(
    options.dynamicRequireTargets
  );
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
    if (isDynamicRequireModulesEnabled && this.getModuleInfo(id).isEntry) {
      // eslint-disable-next-line no-param-reassign
      code =
        getDynamicPackagesEntryIntro(dynamicRequireModuleDirPaths, dynamicRequireModuleSet) + code;
    }

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

    // avoid wrapping as this is a commonjsRegister call
    const disableWrap = isWrappedId(id, DYNAMIC_REGISTER_SUFFIX);
    if (disableWrap) {
      // eslint-disable-next-line no-param-reassign
      id = unwrapId(id, DYNAMIC_REGISTER_SUFFIX);
    }

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
      disableWrap,
      commonDir,
      ast,
      defaultIsModuleExports
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
        return getHelpersModule(isDynamicRequireModulesEnabled, ignoreDynamicRequires);
      }

      if (id.startsWith(HELPERS_ID)) {
        return getSpecificHelperProxy(id);
      }

      if (isWrappedId(id, MODULE_SUFFIX)) {
        const actualId = unwrapId(id, MODULE_SUFFIX);
        let name = getName(actualId);
        let code;
        if (isDynamicRequireModulesEnabled) {
          if (['modulePath', 'commonjsRequire', 'createModule'].includes(name)) {
            name = `${name}_`;
          }
          code =
            `import {commonjsRequire, createModule} from "${HELPERS_ID}";\n` +
            `var ${name} = createModule(${JSON.stringify(
              getVirtualPathForDynamicRequirePath(dirname(actualId), commonDir)
            )});\n` +
            `export {${name} as __module}`;
        } else {
          code = `var ${name} = {exports: {}}; export {${name} as __module}`;
        }
        return {
          code,
          syntheticNamedExports: '__module',
          meta: { commonjs: { isCommonJS: false } }
        };
      }

      if (isWrappedId(id, EXPORTS_SUFFIX)) {
        const actualId = unwrapId(id, EXPORTS_SUFFIX);
        const name = getName(actualId);
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

      if (id === DYNAMIC_PACKAGES_ID) {
        return getDynamicPackagesModule(dynamicRequireModuleDirPaths, commonDir);
      }

      if (id.startsWith(DYNAMIC_JSON_PREFIX)) {
        return getDynamicJsonProxy(id, commonDir);
      }

      if (isDynamicModuleImport(id, dynamicRequireModuleSet)) {
        return `export default require(${JSON.stringify(normalizePathSlashes(id))});`;
      }

      if (isWrappedId(id, DYNAMIC_REGISTER_SUFFIX)) {
        return getDynamicRequireProxy(
          normalizePathSlashes(unwrapId(id, DYNAMIC_REGISTER_SUFFIX)),
          commonDir
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

    transform(code, rawId) {
      let id = rawId;

      if (isWrappedId(id, DYNAMIC_REGISTER_SUFFIX)) {
        id = unwrapId(id, DYNAMIC_REGISTER_SUFFIX);
      }

      const extName = extname(id);
      if (
        extName !== '.cjs' &&
        id !== DYNAMIC_PACKAGES_ID &&
        !id.startsWith(DYNAMIC_JSON_PREFIX) &&
        (!filter(id) || !extensions.includes(extName))
      ) {
        return null;
      }

      try {
        return transformAndCheckExports.call(this, code, rawId);
      } catch (err) {
        return this.error(err, err.loc);
      }
    }
  };
}
