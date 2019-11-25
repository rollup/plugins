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
