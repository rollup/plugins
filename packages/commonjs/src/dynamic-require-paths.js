import { statSync } from 'fs';

import { join, resolve } from 'path';

import glob from 'glob';

import { normalizePathSlashes } from './utils';
import { getPackageEntryPoint } from './dynamic-packages-manager';

function isDirectory(path) {
  try {
    if (statSync(path).isDirectory()) return true;
  } catch (ignored) {
    // Nothing to do here
  }
  return false;
}

export default function getDynamicRequirePaths(patterns) {
  const dynamicRequireModuleSet = new Set();
  for (const pattern of !patterns || Array.isArray(patterns) ? patterns || [] : [patterns]) {
    const isNegated = pattern.startsWith('!');
    const modifySet = Set.prototype[isNegated ? 'delete' : 'add'].bind(dynamicRequireModuleSet);
    for (const path of glob.sync(isNegated ? pattern.substr(1) : pattern)) {
      modifySet(normalizePathSlashes(resolve(path)));
      if (isDirectory(path)) {
        modifySet(normalizePathSlashes(resolve(join(path, getPackageEntryPoint(path)))));
      }
    }
  }
  const dynamicRequireModuleDirPaths = Array.from(dynamicRequireModuleSet.values()).filter((path) =>
    isDirectory(path)
  );
  return { dynamicRequireModuleSet, dynamicRequireModuleDirPaths };
}
