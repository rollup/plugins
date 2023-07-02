/* eslint-disable import/no-dynamic-require, global-require */

function takeModule(withName) {
  return require.resolve(withName);
}

t.throws(() => takeModule('./dep.js'), {
  message:
    'Could not dynamically require/require.resolve "./dep.js". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.'
});
