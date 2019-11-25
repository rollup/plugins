const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('options.jsnext still works with correct priority', async (t) => {
  const bundle = await rollup({
    input: 'jsnext/main.js',
    plugins: [nodeResolve({ jsnext: true, main: true })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'JSNEXT');
});

test('options.module still works with correct priority', async (t) => {
  const bundle = await rollup({
    input: 'module/main.js',
    plugins: [nodeResolve({ module: true, main: true, preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'MODULE');
});

it('should support enabling "jsnext" field resolution', () =>
  rollup
    .rollup({
      input: 'samples/prefer-module/main.js',
      plugins: [nodeResolve({ main: false, module: false, jsnext: true })]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'JSNEXT-ENTRY');
    }));

it('should support disabling "module" field resolution', () =>
  rollup
    .rollup({
      input: 'samples/prefer-main/main.js',
      plugins: [nodeResolve({ module: false })]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'MAIN-ENTRY');
    }));

it('should support disabling "main" field resolution', () =>
  rollup
    .rollup({
      input: 'samples/prefer-module/main.js',
      plugins: [nodeResolve({ main: false })]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'MODULE-ENTRY');
    }));

it('finds a module with module field', () =>
  rollup
    .rollup({
      input: 'samples/module/main.js',
      onwarn: expectNoWarnings,
      plugins: [nodeResolve({ preferBuiltins: false })]
    })
    .then(executeBundle)
    .then((module) => {
      assert.equal(module.exports, 'MODULE');
    }));
