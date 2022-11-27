import { fileURLToPath } from 'url';

import type { SyncOpts } from 'resolve';
import resolve from 'resolve';

// const resolveIdAsync = (file: string, opts: AsyncOpts) =>
//   new Promise<string>((fulfil, reject) =>
//     resolveId(file, opts, (err, contents) =>
//       err || typeof contents === 'undefined' ? reject(err) : fulfil(contents)
//     )
//   );

const resolveId = (file: string, opts: SyncOpts) => resolve.sync(file, opts);

/**
 * Returns code asynchronously for the tslib helper library.
 */
export const getTsLibPath = () => {
  // Note: This isn't preferable, but we've no other way to test this bit. Removing the tslib devDep
  //       during the test run doesn't work due to the nature of the pnpm flat node_modules, and
  //       other workspace dependencies that depenend upon tslib.
  try {
    // eslint-disable-next-line no-underscore-dangle
    return resolveId(process.env.__TSLIB_TEST_PATH__ || 'tslib/tslib.es6.js', {
      // @ts-ignore import.meta.url is allowed because the Rollup plugin injects the correct module format
      basedir: fileURLToPath(new URL('.', import.meta.url))
    });
  } catch (_) {
    return null;
  }
};
