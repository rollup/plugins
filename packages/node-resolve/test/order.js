const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('respects order if given module,jsnext:main,main', async (t) => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ mainFields: ['module', 'jsnext:main', 'main'], preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'MODULE-ENTRY');
});

test('prefer module field by default', async (t) => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'MODULE-ENTRY');
});

test('finds and uses a dual-distributed .js & .mjs module', async (t) => {
  const bundle = await rollup({
    input: 'dual-cjs-mjs.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'DUAL-MJS');
});

test('respects order if given jsnext:main, main', async (t) => {
  const bundle = await rollup({
    input: 'prefer-jsnext.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ mainFields: ['jsnext:main', 'main'], preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'JSNEXT-ENTRY');
});
