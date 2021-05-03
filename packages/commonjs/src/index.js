import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import analyzeTopLevelStatements from './analyze-top-level-statements';

import {
  getDynamicPackagesEntryIntro,
  getDynamicPackagesModule,
  isDynamicModuleImport,
  isModuleRegisterProxy,
  unwrapModuleRegisterProxy
} from './dynamic-packages-manager';
import getDynamicRequirePaths from './dynamic-require-paths';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  EXTERNAL_SUFFIX,
  getHelpersModule,
  HELPERS_ID,
  isWrappedId,
  PROXY_SUFFIX,
  unwrapId
} from './helpers';
import { setIsCjsPromise } from './is-cjs';
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
import { normalizePathSlashes } from './utils';

export default function commonjs(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
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
  const isCjsPromises = new Map();

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
        : options.ignoreTryCatch || false;

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

    let disableWrap = false;

    // avoid wrapping in createCommonjsModule, as this is a commonjsRegister call
    if (isModuleRegisterProxy(id)) {
      disableWrap = true;
      // eslint-disable-next-line no-param-reassign
      id = unwrapModuleRegisterProxy(id);
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

      if (isModuleRegisterProxy(id)) {
        return getDynamicRequireProxy(
          normalizePathSlashes(unwrapModuleRegisterProxy(id)),
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
          isCjsPromises
        );
      }

      return null;
    },

    transform(code, rawId) {
      let id = rawId;

      if (isModuleRegisterProxy(id)) {
        id = unwrapModuleRegisterProxy(id);
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
    },

    // eslint-disable-next-line no-shadow
    moduleParsed({ id, meta: { commonjs } }) {
      if (commonjs) {
        const isCjs = commonjs.isCommonJS;
        if (isCjs != null) {
          setIsCjsPromise(isCjsPromises, id, isCjs);
          return;
        }
      }
      setIsCjsPromise(isCjsPromises, id, null);
    }
  };
}
