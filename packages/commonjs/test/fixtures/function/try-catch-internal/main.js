/* eslint-disable global-require */

try {
  t.is(require('./dep.js').foo, 'foo');
} catch (err) {
  throw new Error(`Could not require: ${err}`);
}

try {
  require('./throws.js');
} catch (err) {
  t.is(err.message, 'Expected error');
}
