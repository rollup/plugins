/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require(withName);
}

// The bundled code will run from test/helpers/util.js
t.is(takeModule('../fixtures/function/dynamic-require-fallback/dep.js'), 'dep');
