/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require(withName);
}

takeModule('./direct').value = 'direct-instance';
t.is(takeModule('./direct/index.js').value, 'direct-instance');
t.is(require('./direct/index.js').value, 'direct-instance');

takeModule('./package').value = 'package-instance';
t.is(takeModule('./package/main.js').value, 'package-instance');
t.is(require('./package/main.js').value, 'package-instance');
