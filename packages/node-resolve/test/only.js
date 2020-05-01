const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { getImports } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('specify the only packages to resolve', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: ['only.js'],
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        resolveOnly: ['test']
      })
    ]
  });
  const imports = await getImports(bundle);

  t.is(warnings.length, 0);
  t.snapshot(warnings);
  t.deepEqual(imports, ['@scoped/foo', '@scoped/bar']);
});

test('regex', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'only.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        resolveOnly: [/^@scoped\/.*$/]
      })
    ]
  });
  const imports = await getImports(bundle);

  t.is(warnings.length, 0);
  t.snapshot(warnings);
  t.deepEqual(imports, ['test']);
});

test('deprecated: specify the only packages to resolve', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'only.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        only: ['test']
      })
    ]
  });
  const imports = await getImports(bundle);

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, ['@scoped/foo', '@scoped/bar']);
});

test('deprecated: regex', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'only.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        only: [/^@scoped\/.*$/]
      })
    ]
  });
  const imports = await getImports(bundle);

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, ['test']);
});
