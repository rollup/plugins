/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require(`./${withName}`);
}

t.is(takeModule('submodule1.js'), 'submodule1');
t.is(takeModule('submodule2.js'), 'submodule2');
t.is(takeModule('extramodule1.js'), 'extramodule1');

let hasThrown = false;
try {
  takeModule('extramodule2.js');
} catch (error) {
  t.truthy(/Cannot find module '\.\/extramodule2\.js'/.test(error.message));
  hasThrown = true;
}
t.truthy(hasThrown);
