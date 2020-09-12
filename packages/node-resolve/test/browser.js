const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('disregards top-level browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'node');
});

test('allows use of the top-level browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'browser');
});

test('disregards object browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser-object.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'node');
  t.is(module.exports.dep, 'node-dep');
  t.is(module.exports.test, 42);
});

test('allows use of the object browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser-object.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'browser');
  t.is(module.exports.dep, 'browser-dep');
  t.is(module.exports.test, 43);
});

test('allows use of object browser field, resolving `main`', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'browser');
  t.is(module.exports.dep, 'browser-dep');
  t.is(module.exports.test, 43);
});

test('options.browser = true still works', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-main.js',
    plugins: [
      nodeResolve({
        browser: true
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'browser');
  t.is(module.exports.dep, 'browser-dep');
  t.is(module.exports.test, 43);
});

test('allows use of object browser field, resolving implicit `main`', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-implicit.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'browser');
});

test('allows use of object browser field, resolving replaced builtins', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-builtin.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'browser-fs');
});

test('allows use of object browser field, resolving nested directories', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-nested.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.env, 'browser');
  t.is(module.exports.dep, 'browser-dep');
  t.is(module.exports.test, 43);
});

test('respects local browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser-local.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'component-type');
});

test('allows use of object browser field, resolving to nested node_modules', async (t) => {
  const bundle = await rollup({
    input: 'browser-entry-points-to-node-module.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        main: true,
        browser: true
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'component-type');
});

test('supports `false` in browser field', async (t) => {
  const bundle = await rollup({
    input: 'browser-false.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  await testBundle(t, bundle);
});

test.only('pkg.browser with mapping to prevent bundle by specifying a value of false', async (t) => {
  const bundle = await rollup({
    input: 'browser-object-with-false.js',
    plugins: [nodeResolve({ browser: true }), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'ok');
});
