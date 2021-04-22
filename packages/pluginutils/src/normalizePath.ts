import { win32, posix } from 'path';

import { NormalizePath } from '../types';

const normalizePath: NormalizePath = function (filename: string) {
  return filename.split(win32.sep).join(posix.sep);
};

export { normalizePath as default };
