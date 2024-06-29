import { fileURLToPath } from 'url';

import { createRequire } from 'module';

/**
 * Returns code asynchronously for the tslib helper library.
 */
export const getTsLibPath = () => {
  // @ts-ignore import.meta.url is allowed because the Rollup plugin injects the correct module format
  const require = createRequire(import.meta.url);
  // Note: This isn't preferable, but we've no other way to test this bit. Removing the tslib devDep
  //       during the test run doesn't work due to the nature of the pnpm flat node_modules, and
  //       other workspace dependencies that depenend upon tslib.
  try {
    // eslint-disable-next-line no-underscore-dangle
    return require.resolve(process.env.__TSLIB_TEST_PATH__ || 'tslib/tslib.es6.js', {
      // @ts-ignore See import.meta.url above
      paths: [fileURLToPath(new URL('.', import.meta.url))]
    });
  } catch (_) {
    return null;
  }
};
