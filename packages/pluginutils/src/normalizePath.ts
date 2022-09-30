import { win32, posix } from 'path';

import type { NormalizePath } from '../types';

const normalizePath: NormalizePath = function normalizePath(filename: string) {
  return filename.split(win32.sep).join(posix.sep);
};

export { normalizePath as default };
