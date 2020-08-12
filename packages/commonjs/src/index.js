import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import {
  getDynamicPackagesEntryIntro,
  getDynamicPackagesModule,
  isModuleRegistrationProxy
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
import {
  getDynamicJsonProxy,
  getDynamicRequireProxy,
  getSpecificHelperProxy,
  getStaticRequireProxy,
  getUnknownRequireProxy
} from './proxies';
import getResolveId from './resolve-id';
import {
  checkEsModule,
  hasCjsKeywords,
  normalizePathSlashes,
  transformCommonjs
} from './transform';

export default function commonjs(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const {
    ignoreGlobal,
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

  const resolveId = getResolveId(extensions);

  const sourceMap = options.sourceMap !== false;

  function transformAndCheckExports(code, id) {
    if (isDynamicRequireModulesEnabled && this.getModuleInfo(id).isEntry) {
      code =
        getDynamicPackagesEntryIntro(dynamicRequireModuleDirPaths, dynamicRequireModuleSet) + code;
    }

    const { isEsModule, isCompiledEsModule, hasDefaultExport, hasNamedExports, ast } = checkEsModule(
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

    // avoid wrapping in createCommonjsModule, as this is a commonjsRegister call
    const disableWrap = isModuleRegistrationProxy(id, dynamicRequireModuleSet);

    // TODO Lukas in the other version, this is treating is isCompiledEsModule like esModule with regard to the promise
    return transformCommonjs(
      this.parse,
      code,
      id,
      isEsModule,
      isCompiledEsModule,
      ignoreGlobal || isEsModule,
      ignoreRequire,
      sourceMap,
      isDynamicRequireModulesEnabled,
      dynamicRequireModuleSet,
      disableWrap,
      commonDir,
      ast
    );
  }

  return {
    name: 'commonjs',

    buildStart() {
      if (options.namedExports != null) {
        this.warn(
          'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
        );
      }

      const [major, minor] = this.meta.rollupVersion.split('.').map(Number);
      const minVersion = peerDependencies.rollup.slice(2);
      const [minMajor, minMinor] = minVersion.split('.').map(Number);
      if (major < minMajor || (major === minMajor && minor < minMinor)) {
        this.error(
          `Insufficient Rollup version: "@rollup/plugin-commonjs" requires at least rollup@${minVersion} but found rollup@${this.meta.rollupVersion}.`
        );
      }
    },

    resolveId,

    load(id) {
      if (id === HELPERS_ID) {
        return getHelpersModule(isDynamicRequireModulesEnabled);
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

      if (isModuleRegistrationProxy(id, dynamicRequireModuleSet)) {
        return getDynamicRequireProxy(normalizePathSlashes(id), commonDir);
      }

      if (isWrappedId(id, PROXY_SUFFIX)) {
        const actualId = unwrapId(id, PROXY_SUFFIX);
        return getStaticRequireProxy(
          actualId,
          getRequireReturnsDefault(actualId),
          esModulesWithDefaultExport,
          esModulesWithNamedExports
        );
      }

      return null;
    },

    transform(code, id) {
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
        return transformAndCheckExports.call(this, code, id);
      } catch (err) {
        return this.error(err, err.loc);
      }
    },

    moduleParsed({ id, meta: { commonjs } }) {
      if (commonjs) {
        const isCjs = commonjs.isCommonJS;
        if (isCjs != null) {
          setIsCjsPromise(id, isCjs);
          return;
        }
      }
      setIsCjsPromise(id, null);
    }
  };
}
