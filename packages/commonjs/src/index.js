import { extname } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import { getDynamicPackagesEntryIntro, getDynamicPackagesModule } from './dynamic-packages-manager';
import getDynamicRequirePaths from './dynamic-require-paths';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  EXTERNAL_SUFFIX,
  getHelpersModule,
  getIdFromExternalProxyId,
  getIdFromProxyId,
  HELPERS_ID,
  PROXY_SUFFIX
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
    const { isEsModule, hasDefaultExport, hasNamedExports, ast } = checkEsModule(
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
      setIsCjsPromise(id, false);
      return null;
    }

    const transformed = transformCommonjs(
      this.parse,
      code,
      id,
      isEsModule,
      ignoreGlobal || isEsModule,
      ignoreRequire,
      sourceMap,
      isDynamicRequireModulesEnabled,
      dynamicRequireModuleSet,
      commonDir,
      ast
    );

    setIsCjsPromise(id, isEsModule ? false : Boolean(transformed));
    return transformed;
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

      if (id.endsWith(EXTERNAL_SUFFIX)) {
        const actualId = getIdFromExternalProxyId(id);
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

      const normalizedPath = normalizePathSlashes(id);
      if (dynamicRequireModuleSet.has(normalizedPath) && !normalizedPath.endsWith('.json')) {
        return getDynamicRequireProxy(normalizedPath, commonDir);
      }

      if (id.endsWith(PROXY_SUFFIX)) {
        const actualId = getIdFromProxyId(id);
        return getStaticRequireProxy(
          actualId,
          getRequireReturnsDefault(actualId),
          esModulesWithDefaultExport,
          esModulesWithNamedExports
        );
      }

      if (isDynamicRequireModulesEnabled && this.getModuleInfo(id).isEntry) {
        return getDynamicPackagesEntryIntro(
          id,
          dynamicRequireModuleDirPaths,
          dynamicRequireModuleSet
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
        setIsCjsPromise(id, null);
        return null;
      }

      let transformed;
      try {
        transformed = transformAndCheckExports.call(this, code, id);
      } catch (err) {
        transformed = null;
        setIsCjsPromise(id, false);
        this.error(err, err.loc);
      }

      return transformed;
    }
  };
}
