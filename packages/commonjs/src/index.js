import { existsSync, readFileSync } from 'fs';

import { extname, join } from 'path';

import { createFilter } from '@rollup/pluginutils';
import getCommonDir from 'commondir';

import { peerDependencies } from '../package.json';

import getDynamicRequirePaths from './dynamic-require-paths';
import {
  DYNAMIC_JSON_PREFIX,
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_PREFIX,
  EXTERNAL_SUFFIX,
  getIdFromExternalProxyId,
  getIdFromProxyId,
  getVirtualPathForDynamicRequirePath,
  HELPER_NON_DYNAMIC,
  HELPERS,
  HELPERS_DYNAMIC,
  HELPERS_ID,
  PROXY_SUFFIX
} from './helpers';
import { getIsCjsPromise, setIsCjsPromise } from './is-cjs';
import getResolveId from './resolve-id';
import {
  checkEsModule,
  hasCjsKeywords,
  normalizePathSlashes,
  transformCommonjs
} from './transform';
import { getName } from './utils';

export default function commonjs(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  // TODO Lukas document values: true, 'preferred', 'auto', false
  const { ignoreGlobal, requireReturnsDefault: requireReturnsDefaultOption } = options;
  const getRequireReturnsDefault =
    typeof requireReturnsDefaultOption === 'function'
      ? requireReturnsDefaultOption
      : () => requireReturnsDefaultOption;

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

  function getUnknownRequireProxy(id, requireReturnsDefault) {
    // TODO Lukas test!
    if (requireReturnsDefault === true || id.endsWith('.json')) {
      return `export {default} from ${JSON.stringify(id)};`;
    }
    const name = getName(id);
    const exported =
      requireReturnsDefault === 'auto'
        ? `import {getDefaultExportFromNamespaceIfNotNamed} from "${HELPERS_ID}"; export default getDefaultExportFromNamespaceIfNotNamed(${name})`
        : requireReturnsDefault === 'preferred'
        ? `import {getDefaultExportFromNamespaceIfPresent} from "${HELPERS_ID}"; export default getDefaultExportFromNamespaceIfPresent(${name})`
        : `export default ${name}`;
    return `import * as ${name} from ${JSON.stringify(id)}; ${exported}`;
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
        let code = HELPERS;

        // Do not bloat everyone's code with the module manager code
        if (isDynamicRequireModulesEnabled) code += HELPERS_DYNAMIC;
        else code += HELPER_NON_DYNAMIC;

        return code;
      }

      // commonjsHelpers?commonjsRegister
      if (id.startsWith(HELPERS_ID)) {
        return `export {${id.split('?')[1]} as default} from '${HELPERS_ID}';`;
      }

      if (id.endsWith(EXTERNAL_SUFFIX)) {
        const actualId = getIdFromExternalProxyId(id);
        return getUnknownRequireProxy(actualId, getRequireReturnsDefault(actualId));
      }

      if (id === DYNAMIC_PACKAGES_ID) {
        let code = `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');`;
        for (const dir of dynamicRequireModuleDirPaths) {
          let entryPoint = 'index.js';

          try {
            if (existsSync(join(dir, 'package.json'))) {
              entryPoint =
                JSON.parse(readFileSync(join(dir, 'package.json'), { encoding: 'utf8' })).main ||
                entryPoint;
            }
          } catch (ignored) {
            // ignored
          }

          code += `\ncommonjsRegister(${JSON.stringify(
            getVirtualPathForDynamicRequirePath(dir, commonDir)
          )}, function (module, exports) {
  module.exports = require(${JSON.stringify(normalizePathSlashes(join(dir, entryPoint)))});
});`;
        }
        return code;
      }

      let actualId = id;

      const isDynamicJson = actualId.startsWith(DYNAMIC_JSON_PREFIX);
      if (isDynamicJson) {
        actualId = actualId.slice(DYNAMIC_JSON_PREFIX.length);
      }

      const normalizedPath = normalizePathSlashes(actualId);

      if (isDynamicJson) {
        return `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');\ncommonjsRegister(${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
        )}, function (module, exports) {
  module.exports = require(${JSON.stringify(normalizedPath)});
});`;
      }

      // TODO Lukas do we need special dynamic JSON handling?
      if (dynamicRequireModuleSet.has(normalizedPath) && !normalizedPath.endsWith('.json')) {
        // Try our best to still export the module fully.
        // The commonjs polyfill should take care of circular references.

        return `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');\ncommonjsRegister(${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
        )}, function (module, exports) {
  ${readFileSync(normalizedPath, { encoding: 'utf8' })}
});`;
      }

      if (actualId.endsWith(PROXY_SUFFIX)) {
        actualId = getIdFromProxyId(actualId);
        const requireReturnsDefault = getRequireReturnsDefault(actualId);
        const name = getName(actualId);

        return getIsCjsPromise(actualId).then((isCjs) => {
          // TODO Lukas make sure all sub-cases are covered
          if (
            dynamicRequireModuleSet.has(normalizePathSlashes(actualId)) &&
            !actualId.endsWith('.json')
          ) {
            return `import {commonjsRequire} from '${HELPERS_ID}'; const ${name} = commonjsRequire(${JSON.stringify(
              getVirtualPathForDynamicRequirePath(normalizePathSlashes(actualId), commonDir)
            )}); export default (${name} && ${name}['default']) || ${name}`;
          } else if (isCjs) {
            return `import { __moduleExports } from ${JSON.stringify(
              actualId
            )}; export default __moduleExports;`;
          } else if (isCjs === null) {
            return getUnknownRequireProxy(actualId, requireReturnsDefault);
          } else if (
            requireReturnsDefault !== true &&
            (!requireReturnsDefault ||
              !esModulesWithDefaultExport.has(actualId) ||
              (esModulesWithNamedExports.has(actualId) && requireReturnsDefault === 'auto'))
          ) {
            return `import * as ${name} from ${JSON.stringify(actualId)}; export default ${name};`;
          }
          return `export {default} from ${JSON.stringify(actualId)};`;
        });
      }

      if (isDynamicRequireModulesEnabled && this.getModuleInfo(id).isEntry) {
        let code;

        try {
          code = readFileSync(actualId, { encoding: 'utf8' });
        } catch (ex) {
          this.warn(`Failed to read file ${actualId}, dynamic modules might not work correctly`);
          return null;
        }

        let dynamicImports = Array.from(dynamicRequireModuleSet)
          .map((dynamicId) => `require(${JSON.stringify(DYNAMIC_REGISTER_PREFIX + dynamicId)});`)
          .join('\n');

        if (dynamicRequireModuleDirPaths.length) {
          dynamicImports += `require(${JSON.stringify(
            DYNAMIC_REGISTER_PREFIX + DYNAMIC_PACKAGES_ID
          )});`;
        }

        code = `${dynamicImports}\n${code}`;

        return code;
      }

      return null;
    },

    transform(code, id) {
      if (id !== DYNAMIC_PACKAGES_ID && !id.startsWith(DYNAMIC_JSON_PREFIX)) {
        if (!filter(id) || extensions.indexOf(extname(id)) === -1) {
          setIsCjsPromise(id, null);
          return null;
        }
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
