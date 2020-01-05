import { resolve, sep } from 'path';

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
  // this juggling is to join two paths:
  // 1. the basePath which has been normalized to use /
  // 2. the incoming glob (id) matcher, which uses /
  // we can't use join or resolve here because Node will force backslash (\) on windows
  const result = [...basePath.split('/'), ...id.split('/')].join('/');
  return result;
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
