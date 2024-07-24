import type { NormalizePath } from '../types';

const normalizePath: NormalizePath = function normalizePath(filename: string) {
  return filename.replace(/\\/g, '/');
};

export { normalizePath as default };
