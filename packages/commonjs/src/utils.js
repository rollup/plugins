/* eslint-disable import/prefer-default-export */

import { basename, dirname, extname, sep } from 'path';

import { makeLegalIdentifier } from '@rollup/pluginutils';

export function deconflict(scope, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);

  while (scope.contains(deconflicted) || globals.has(deconflicted)) {
    deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
    i += 1;
  }
  // eslint-disable-next-line no-param-reassign
  scope.declarations[deconflicted] = true;

  return deconflicted;
}

export function getName(id) {
  const name = makeLegalIdentifier(basename(id, extname(id)));
  if (name !== 'index') {
    return name;
  }
  const segments = dirname(id).split(sep);
  return makeLegalIdentifier(segments[segments.length - 1]);
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
