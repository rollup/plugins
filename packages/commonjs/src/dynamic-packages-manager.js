import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_PREFIX,
  getVirtualPathForDynamicRequirePath,
  HELPERS_ID
} from './helpers';
import { normalizePathSlashes } from './utils';

export function getDynamicPackagesModule(dynamicRequireModuleDirPaths, commonDir) {
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

export function getDynamicPackagesEntryIntro(
  dynamicRequireModuleDirPaths,
  dynamicRequireModuleSet
) {
  let dynamicImports = Array.from(
    dynamicRequireModuleSet,
    (dynamicId) => `require(${JSON.stringify(DYNAMIC_REGISTER_PREFIX + dynamicId)});`
  ).join('\n');

  if (dynamicRequireModuleDirPaths.length) {
    dynamicImports += `require(${JSON.stringify(DYNAMIC_REGISTER_PREFIX + DYNAMIC_PACKAGES_ID)});`;
  }

  return dynamicImports;
}

export function isModuleRegistrationProxy(id, dynamicRequireModuleSet) {
  const normalizedPath = normalizePathSlashes(id);
  return dynamicRequireModuleSet.has(normalizedPath) && !normalizedPath.endsWith('.json');
}
