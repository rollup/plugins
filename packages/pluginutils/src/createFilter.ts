import { resolve, posix, isAbsolute } from 'path';

import pm from 'picomatch';

import type { CreateFilter, CreateHookFilter } from '../types';

import ensureArray from './utils/ensureArray';
import normalizePath from './normalizePath';

function getMatcherString(id: string, resolutionBase: string | false | null | undefined) {
  if (resolutionBase === false || isAbsolute(id) || id.startsWith('**')) {
    return normalizePath(id);
  }

  // resolve('') is valid and will default to process.cwd()
  const basePath = normalizePath(resolve(resolutionBase || ''))
    // escape all possible (posix + win) path characters that might interfere with regex
    .replace(/[-^$*+?.()|[\]{}]/g, '\\$&');
  // Note that we use posix.join because:
  // 1. the basePath has been normalized to use /
  // 2. the incoming glob (id) matcher, also uses /
  // otherwise Node will force backslash (\) on windows
  return posix.join(basePath, normalizePath(id));
}

const createHookFilter: CreateHookFilter = function createHookFilter(include?, exclude?, options?) {
  const resolutionBase = options && options.resolve;

  const getMatcher = (id: string | RegExp) => {
    if (id instanceof RegExp) {
      return new RegExp(id);
    }
    return getMatcherString(id, resolutionBase);
  };

  const includeMatchers = ensureArray(include).map(getMatcher);
  const excludeMatchers = ensureArray(exclude).map(getMatcher);

  excludeMatchers.push(/\0/);

  return {
    include: includeMatchers,
    exclude: excludeMatchers
  };
};

const createFilter: CreateFilter = function createFilter(include?, exclude?, options?) {
  const { include: includeFilters, exclude: excludeFilters } = createHookFilter(
    include,
    exclude,
    options
  ) as {
    include: (string | RegExp)[];
    exclude: (string | RegExp)[];
  };

  const getMatcher = (id: string | RegExp) => {
    if (id instanceof RegExp) {
      const reg = new RegExp(id);
      return {
        test: (what: string) => {
          reg.lastIndex = 0;
          return reg.test(what);
        }
      };
    }
    const fn = pm(id, { dot: true });
    return {
      test: (what: string) => fn(what)
    };
  };

  const includeMatchers = includeFilters.map((id) => getMatcher(id));
  const excludeMatchers = excludeFilters.map((id) => getMatcher(id));

  return function result(id: string | unknown): boolean {
    if (typeof id !== 'string') return false;

    const pathId = normalizePath(id);

    for (let i = 0; i < excludeMatchers.length; ++i) {
      if (excludeMatchers[i].test(pathId)) return false;
    }

    for (let i = 0; i < includeMatchers.length; ++i) {
      if (includeMatchers[i].test(pathId)) return true;
    }

    return !includeMatchers.length;
  };
};

export { createFilter, createHookFilter };
