import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

import glob from 'glob';

import { normalizePathSlashes } from './utils';

function getPackageEntryPoint(dirPath) {
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

function isDirectory(path) {
  try {
    if (statSync(path).isDirectory()) return true;
  } catch (ignored) {
    // Nothing to do here
  }
  return false;
}

export default function getDynamicRequireModuleSet(patterns) {
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
  return dynamicRequireModuleSet;
}
