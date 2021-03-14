/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require(`./${withName}`);
}

t.is(takeModule('submodule1.js'), 'submodule1');
t.is(takeModule('submodule2.js'), 'submodule2');
t.is(takeModule('extramodule1.js'), 'extramodule1');
t.throws(() => takeModule('extramodule2.js'), {
  message:
    'Could not dynamically require "./extramodule2.js". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.'
});
