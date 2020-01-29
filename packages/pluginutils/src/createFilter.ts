import { resolve, sep, posix } from 'path';

import mm from 'micromatch';

import { CreateFilter } from '../types';

import ensureArray from './utils/ensureArray';

function getMatcherString(id: string, resolutionBase: string | false | null | undefined) {
  if (resolutionBase === false) {
    return id;
  }

  // resolve('') is valid and will default to process.cwd()
  const basePath = resolve(resolutionBase || '')
    .split(sep)
    .join('/')
    // escape all possible (posix + win) path characters that might interfere with regex
    .replace(/[-^$*+?.()|[\]{}]/g, '\\$&');
  // Note that we use posix.join because:
  // 1. the basePath has been normalized to use /
  // 2. the incoming glob (id) matcher, also uses /
  // otherwise Node will force backslash (\) on windows
  return posix.join(basePath, id);
}

const createFilter: CreateFilter = function createFilter(include?, exclude?, options?) {
  const resolutionBase = options && options.resolve;

  const getMatcher = (id: string | RegExp) =>
    id instanceof RegExp
      ? id
      : {
          test: (what: string) => {
            // this refactor is a tad overly verbose but makes for easy debugging
            const pattern = getMatcherString(id, resolutionBase);
            const fn = mm.matcher(pattern, { dot: true });
            const result = fn(what);

            return result;
          }
        };

  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);

  return function result(id: string | unknown): boolean {
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
