import { readFile } from 'fs';

import resolveId, { AsyncOpts } from 'resolve';

export const TSLIB_ID = '\0tslib';

const readFileAsync = (file: string) =>
  new Promise<string>((fulfil, reject) =>
    readFile(file, 'utf-8', (err, contents) => (err ? reject(err) : fulfil(contents)))
  );

const resolveIdAsync = (file: string, opts?: AsyncOpts) =>
  new Promise<string>((fulfil, reject) =>
    resolveId(file, opts, (err, contents) => (err ? reject(err) : fulfil(contents)))
  );

/**
 * Returns code asynchronously for the tslib helper library.
 * @param customCode Overrides the injected helpers with a custom version.
 */
export async function getTsLibCode(customHelperCode: string | Promise<string>) {
  if (customHelperCode) return customHelperCode;

  const defaultPath = await resolveIdAsync('tslib/tslib.es6.js', { basedir: __dirname });
  return readFileAsync(defaultPath);
}
