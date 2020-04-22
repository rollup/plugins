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
  getVirtualPathForDynamicRequirePath,
  EXTERNAL_SUFFIX,
  getIdFromExternalProxyId,
  getIdFromProxyId,
  HELPERS,
  HELPERS_ID,
  HELPER_NON_DYNAMIC,
  HELPERS_DYNAMIC,
  PROXY_SUFFIX
} from './helpers';

import { getIsCjsPromise, setIsCjsPromise } from './is-cjs';
import getResolveId from './resolve-id';
import {
  checkEsModule,
  normalizePathSlashes,
  hasCjsKeywords,
  transformCommonjs
} from './transform';
import { getName } from './utils';

export default function commonjs(options = {}) {
  const extensions = options.extensions || ['.js'];
  const filter = createFilter(options.include, options.exclude);
  const { ignoreGlobal } = options;

  const { dynamicRequireModuleSet, dynamicRequireModuleDirPaths } = getDynamicRequirePaths(
    options.dynamicRequireTargets
  );
  const isDynamicRequireModulesEnabled = dynamicRequireModuleSet.size > 0;
  const commonDir = isDynamicRequireModulesEnabled
    ? getCommonDir(null, Array.from(dynamicRequireModuleSet).concat(process.cwd()))
    : null;

  const esModulesWithoutDefaultExport = new Set();
  const esModulesWithDefaultExport = new Set();

  const ignoreRequire =
    typeof options.ignore === 'function'
      ? options.ignore
      : Array.isArray(options.ignore)
      ? (id) => options.ignore.includes(id)
      : () => false;

  const resolveId = getResolveId(extensions);

  const sourceMap = options.sourceMap !== false;

  function transformAndCheckExports(code, id) {
    const { isEsModule, hasDefaultExport, ast } = checkEsModule(this.parse, code, id);

    const isDynamicRequireModule = dynamicRequireModuleSet.has(normalizePathSlashes(id));

    if (isEsModule && !isDynamicRequireModule) {
      (hasDefaultExport ? esModulesWithDefaultExport : esModulesWithoutDefaultExport).add(id);
    }
    // it is not an ES module but it does not have CJS-specific elements.
    else if (!hasCjsKeywords(code, ignoreGlobal)) {
      esModulesWithoutDefaultExport.add(id);
      setIsCjsPromise(id, false);
      return null;
    }

    const transformed = transformCommonjs(
      this.parse,
      code,
      id,
      this.getModuleInfo(id).isEntry,
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

    if (!transformed) {
      if (!isEsModule || isDynamicRequireModule) esModulesWithoutDefaultExport.add(id);
      return null;
    }

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
        let code = HELPERS;

        // Do not bloat everyone's code with the module manager code
        if (isDynamicRequireModulesEnabled) code += HELPERS_DYNAMIC;
        else code += HELPER_NON_DYNAMIC;

        return code;
      }

      // generate proxy modules
      if (id.endsWith(EXTERNAL_SUFFIX)) {
        const actualId = getIdFromExternalProxyId(id);
        const name = getName(actualId);

        if (actualId === HELPERS_ID || actualId === DYNAMIC_PACKAGES_ID)
          // These do not export default
          return `import * as ${name} from ${JSON.stringify(actualId)}; export default ${name};`;

        return `import ${name} from ${JSON.stringify(actualId)}; export default ${name};`;
      }

      if (id === DYNAMIC_PACKAGES_ID) {
        let code = `const { commonjsRegister } = require('${HELPERS_ID}');`;
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
        return `require('${HELPERS_ID}').commonjsRegister(${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
        )}, function (module, exports) {
  module.exports = require(${JSON.stringify(normalizedPath)});
});`;
      }

      if (dynamicRequireModuleSet.has(normalizedPath) && !normalizedPath.endsWith('.json')) {
        // Try our best to still export the module fully.
        // The commonjs polyfill should take care of circular references.

        return `require('${HELPERS_ID}').commonjsRegister(${JSON.stringify(
          getVirtualPathForDynamicRequirePath(normalizedPath, commonDir)
        )}, function (module, exports) {
  ${readFileSync(normalizedPath, { encoding: 'utf8' })}
});`;
      }

      if (actualId.endsWith(PROXY_SUFFIX)) {
        actualId = getIdFromProxyId(actualId);
        const name = getName(actualId);

        return getIsCjsPromise(actualId).then((isCjs) => {
          if (
            dynamicRequireModuleSet.has(normalizePathSlashes(actualId)) &&
            !actualId.endsWith('.json')
          )
            return `import {commonjsRequire} from '${HELPERS_ID}'; const ${name} = commonjsRequire(${JSON.stringify(
              getVirtualPathForDynamicRequirePath(normalizePathSlashes(actualId), commonDir)
            )}); export default (${name} && ${name}['default']) || ${name}`;
          else if (isCjs)
            return `import { __moduleExports } from ${JSON.stringify(
              actualId
            )}; export default __moduleExports;`;
          else if (esModulesWithoutDefaultExport.has(actualId))
            return `import * as ${name} from ${JSON.stringify(actualId)}; export default ${name};`;
          else if (esModulesWithDefaultExport.has(actualId)) {
            return `export {default} from ${JSON.stringify(actualId)};`;
          }
          return `import * as ${name} from ${JSON.stringify(
            actualId
          )}; import {getCjsExportFromNamespace} from "${HELPERS_ID}"; export default getCjsExportFromNamespace(${name})`;
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
