/* eslint-disable global-require */

try {
  require('uninstalled-external-module');
} catch (ignored) {
  throw new Error('This should no longer be reached as the require is removed.');
}
