import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  DYNAMIC_PACKAGES_ID,
  DYNAMIC_REGISTER_PREFIX,
  getVirtualPathForDynamicRequirePath,
  HELPERS_ID
} from './helpers';
import { normalizePathSlashes } from './transform';

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
  id,
  dynamicRequireModuleDirPaths,
  dynamicRequireModuleSet
) {
  try {
    const code = readFileSync(id, { encoding: 'utf8' });
    let dynamicImports = Array.from(
      dynamicRequireModuleSet,
      (dynamicId) => `require(${JSON.stringify(DYNAMIC_REGISTER_PREFIX + dynamicId)});`
    ).join('\n');

    if (dynamicRequireModuleDirPaths.length) {
      dynamicImports += `require(${JSON.stringify(
        DYNAMIC_REGISTER_PREFIX + DYNAMIC_PACKAGES_ID
      )});`;
    }

    return `${dynamicImports}\n${code}`;
  } catch (ex) {
    this.warn(`Failed to read file ${id}, dynamic modules might not work correctly`);
    return null;
  }
}
