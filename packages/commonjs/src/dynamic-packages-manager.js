import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_SUFFIX,
  HELPERS_ID,
  isWrappedId,
  unwrapId,
  wrapId
} from './helpers';
import { getVirtualPathForDynamicRequirePath, normalizePathSlashes } from './utils';

export function getPackageEntryPoint(dirPath) {
  let entryPoint = 'index.js';

  try {
    if (existsSync(join(dirPath, 'package.json'))) {
      entryPoint =
        JSON.parse(readFileSync(join(dirPath, 'package.json'), { encoding: 'utf8' })).main ||
        entryPoint;
    }
  } catch (ignored) {
    // ignored
  }

  return entryPoint;
}

export function getDynamicPackagesModule(dynamicRequireModuleDirPaths, commonDir) {
  let code = `const commonjsRegister = require('${HELPERS_ID}?commonjsRegister');`;
  for (const dir of dynamicRequireModuleDirPaths) {
    const entryPoint = getPackageEntryPoint(dir);

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
    (dynamicId) => `require(${JSON.stringify(wrapModuleRegisterProxy(dynamicId))});`
  ).join('\n');

  if (dynamicRequireModuleDirPaths.length) {
    dynamicImports += `require(${JSON.stringify(wrapModuleRegisterProxy(DYNAMIC_PACKAGES_ID))});`;
  }

  return dynamicImports;
}

export function wrapModuleRegisterProxy(id) {
  return wrapId(id, DYNAMIC_REGISTER_SUFFIX);
}

export function unwrapModuleRegisterProxy(id) {
  return unwrapId(id, DYNAMIC_REGISTER_SUFFIX);
}

export function isModuleRegisterProxy(id) {
  return isWrappedId(id, DYNAMIC_REGISTER_SUFFIX);
}

export function isDynamicModuleImport(id, dynamicRequireModuleSet) {
  const normalizedPath = normalizePathSlashes(id);
  return dynamicRequireModuleSet.has(normalizedPath) && !normalizedPath.endsWith('.json');
}
