import resolveId, { AsyncOpts } from 'resolve';

const resolveIdAsync = (file: string, opts: AsyncOpts) =>
  new Promise<string>((fulfil, reject) =>
    resolveId(file, opts, (err, contents) => (err || typeof contents === 'undefined' ? reject(err) : fulfil(contents)))
  );

/**
 * Returns code asynchronously for the tslib helper library.
 */
export default function getTsLibPath() {
  return resolveIdAsync('tslib/tslib.es6.js', { basedir: __dirname });
}
