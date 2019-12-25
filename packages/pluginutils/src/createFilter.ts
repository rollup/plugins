import { resolve, join, sep } from 'path';

import mm from 'micromatch';

import { CreateFilter } from '../types';

import ensureArray from './utils/ensureArray';

const ESCAPE_IN_PATH = '()+@!';

function getMatcherString(id: string, resolutionBase: string | false | null | undefined) {
  if (resolutionBase === false) {
    return id;
  }
  let basePath = typeof resolutionBase === 'string' ? resolve(resolutionBase) : process.cwd();
  for (const char of ESCAPE_IN_PATH) {
    basePath = basePath.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  }
  return join(basePath, id);
}

const createFilter: CreateFilter = function createFilter(include?, exclude?, options?) {
  const resolutionBase = options && options.resolve;

  const getMatcher = (id: string | RegExp) =>
    id instanceof RegExp
      ? id
      : {
          test: mm.matcher(
            getMatcherString(id, resolutionBase)
              .split(sep)
              .join('/'),
            { dot: true }
          )
        };

  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);

  return function result(id: string | any): boolean {
    if (typeof id !== 'string') return false;
    if (/\0/.test(id)) return false;

    const pathId = id.split(sep).join('/');

    for (let i = 0; i < excludeMatchers.length; ++i) {
      const matcher = excludeMatchers[i];
      if (matcher.test(pathId)) return false;
    }

    for (let i = 0; i < includeMatchers.length; ++i) {
      const matcher = includeMatchers[i];
      if (matcher.test(pathId)) return true;
    }

    return !includeMatchers.length;
  };
};

export { createFilter as default };
