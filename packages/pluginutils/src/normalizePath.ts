import { win32, posix } from 'pathe';

import type { NormalizePath } from '../types';

const normalizePathRegExp = new RegExp(`\\${win32.sep}`, 'g');

const normalizePath: NormalizePath = function normalizePath(filename: string) {
  return filename.replace(normalizePathRegExp, posix.sep);
};

export { normalizePath as default };
