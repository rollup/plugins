import { statSync } from 'fs';

import { resolve } from 'path';

import glob from 'glob';

import { normalizePathSlashes } from './utils';

export default function getDynamicRequirePaths(patterns) {
  const dynamicRequireModuleSet = new Set();
  for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
    const isNegated = pattern.startsWith('!');
    const modifySet = Set.prototype[isNegated ? 'delete' : 'add'].bind(dynamicRequireModuleSet);
    for (const path of glob.sync(isNegated ? pattern.substr(1) : pattern)) {
      modifySet(normalizePathSlashes(resolve(path)));
    }
  }
  const dynamicRequireModuleDirPaths = Array.from(dynamicRequireModuleSet.values()).filter(
    (path) => {
      try {
        if (statSync(path).isDirectory()) return true;
      } catch (ignored) {
        // Nothing to do here
      }
      return false;
    }
  );
  return { dynamicRequireModuleSet, dynamicRequireModuleDirPaths };
}
