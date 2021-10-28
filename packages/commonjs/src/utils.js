/* eslint-disable import/prefer-default-export */

import { basename, dirname, extname } from 'path';

import { makeLegalIdentifier } from '@rollup/pluginutils';

export function deconflict(scopes, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);
  const hasConflicts = () =>
    scopes.some((scope) => scope.contains(deconflicted)) || globals.has(deconflicted);

  while (hasConflicts()) {
    deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
    i += 1;
  }

  for (const scope of scopes) {
    scope.declarations[deconflicted] = true;
  }

  return deconflicted;
}

export function getName(id) {
  const name = makeLegalIdentifier(basename(id, extname(id)));
  if (name !== 'index') {
    return name;
  }
  return makeLegalIdentifier(basename(dirname(id)));
}

export function normalizePathSlashes(path) {
  return path.replace(/\\/g, '/');
}

const VIRTUAL_PATH_BASE = '/$$rollup_base$$';
export const getVirtualPathForDynamicRequirePath = (path, commonDir) => {
  const normalizedPath = normalizePathSlashes(path);
  return normalizedPath.startsWith(commonDir)
    ? VIRTUAL_PATH_BASE + normalizedPath.slice(commonDir.length)
    : normalizedPath;
};

export function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}
