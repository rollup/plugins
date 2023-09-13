/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require(withName);
}

t.is(takeModule('./dep1.js'), 'dep');
// The bundled code will run from test/helpers/util.js
t.is(takeModule('../fixtures/function/dynamic-require-targets-fallback/dep2.js'), 'dep');
