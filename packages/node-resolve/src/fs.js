import fs from 'fs';

import { promisify } from 'util';

export const exists = promisify(fs.exists);
export const readFile = promisify(fs.readFile);
export const realpath = promisify(fs.realpath);
export { realpathSync } from 'fs';
export const stat = promisify(fs.stat);
