import { extname } from 'pathe';

import type { AddExtension } from '../types';

const addExtension: AddExtension = function addExtension(filename, ext = '.js') {
  let result = `${filename}`;
  if (!extname(filename)) result += ext;
  return result;
};

export { addExtension as default };
