import fs from 'fs';

import { promisify } from 'util';

export const access = promisify(fs.access);
export const readFile = promisify(fs.readFile);
export const realpath = promisify(fs.realpath);
export { realpathSync } from 'fs';
export const stat = promisify(fs.stat);
export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
export async function fileExists(filePath) {
  try {
    const res = await stat(filePath);
    return res.isFile();
  } catch {
    return false;
  }
}
