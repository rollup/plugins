const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('options.jsnext still works with correct priority', async (t) => {
  const bundle = await rollup({
    input: 'jsnext.js',
    plugins: [nodeResolve({ jsnext: true, main: true })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'JSNEXT');
});

test('options.module still works with correct priority', async (t) => {
  const bundle = await rollup({
    input: 'module.js',
    plugins: [nodeResolve({ module: true, main: true, preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'MODULE');
});

test('should support enabling "jsnext" field resolution', async (t) => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    plugins: [nodeResolve({ main: false, module: false, jsnext: true })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'JSNEXT-ENTRY');
});

test('should support disabling "module" field resolution', async (t) => {
  const bundle = await rollup({
    input: 'prefer-main.js',
    plugins: [nodeResolve({ module: false })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN-ENTRY');
});

test('should support disabling "main" field resolution', async (t) => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    plugins: [nodeResolve({ main: false })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MODULE-ENTRY');
});

test('finds a module with module field', async (t) => {
  const bundle = await rollup({
    input: 'module.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MODULE');
});
