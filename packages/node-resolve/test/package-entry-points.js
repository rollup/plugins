const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('handles export map shorthand', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with fallback', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with top level mappings', async (t) => {
  const bundle = await rollup({
    input: 'exports-top-level-mappings.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.main, 'MAIN MAPPED');
  t.is(module.exports.foo, 'FOO MAPPED');
});

test('handles export map with top level conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-top-level-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with nested conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-nested-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles conditions with a fallback', async (t) => {
  const bundle = await rollup({
    input: 'exports-conditions-fallback.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles top level mappings with conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-mappings-and-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.main, 'MAIN MAPPED');
  t.is(module.exports.foo, 'FOO MAPPED');
  t.is(module.exports.bar, 'BAR MAPPED');
});

test('handles directory exports', async (t) => {
  const bundle = await rollup({
    input: 'exports-directory.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.a, 'exported-foo a');
  t.is(module.exports.b, 'exported-foo b');
  t.is(module.exports.c, 'exported-foo c');
});

test('handles main directory exports', async (t) => {
  const bundle = await rollup({
    input: 'exports-main-directory.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.a, 'exported a');
  t.is(module.exports.b, 'exported b');
  t.is(module.exports.c, 'exported c');
});

test('logs a warning when using shorthand and importing a subpath', async (t) => {
  t.plan(2);
  const errors = [];
  await rollup({
    input: 'exports-shorthand-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(errors[0].message.includes('Could not resolve import "exports-shorthand/foo" in '));
  t.true(errors[0].message.includes('Package subpath "./foo" is not defined by "exports" in'));
});

test('logs a warning when a subpath cannot be found', async (t) => {
  t.plan(2);
  const errors = [];
  await rollup({
    input: 'exports-non-existing-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(
    errors[0].message.includes('Could not resolve import "exports-non-existing-subpath/bar" in ')
  );
  t.true(errors[0].message.includes('Package subpath "./bar" is not defined by "exports" in'));
});

test.only('prevents importing files not specified in exports map', async (t) => {
  t.plan(2);
  const errors = [];
  await rollup({
    input: 'exports-prevent-unspecified-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(
    errors[0].message.includes('Could not resolve import "exports-top-level-mappings/bar" in ')
  );
  t.true(errors[0].message.includes('Package subpath "./bar" is not defined by "exports" in'));
});

test('uses "require" condition when a module is referenced with require', async (t) => {
  const bundle = await rollup({
    input: 'exports-cjs.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [commonjs(), nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'CJS');
});

test('can use star pattern in exports field', async (t) => {
  const bundle = await rollup({
    input: 'exports-star.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, { a: 'A', b: 'B', c: 'C' });
});
