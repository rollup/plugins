// eslint-disable-next-line global-require,import/no-dynamic-require
t.throws(() => require(getRequireTarget()), {
  message:
    'Could not dynamically require "foo-bar". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.'
});

function getRequireTarget() {
  return 'foo-bar';
}
