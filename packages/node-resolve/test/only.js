const { join, resolve } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { getImports, getResolvedModules } = require('../../../util/test');

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
  const modules = await getResolvedModules(bundle);

  t.is(warnings.length, 0);
  t.snapshot(warnings);
  t.deepEqual(imports, ['@scoped/foo', '@scoped/bar']);
  t.assert(Object.keys(modules).includes(resolve('only-local.js')));
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
  const modules = await getResolvedModules(bundle);

  t.is(warnings.length, 0);
  t.snapshot(warnings);
  t.deepEqual(imports, ['test']);
  t.assert(Object.keys(modules).includes(resolve('only-local.js')));
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
  const modules = await getResolvedModules(bundle);

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, ['@scoped/foo', '@scoped/bar']);
  t.assert(Object.keys(modules).includes(resolve('only-local.js')));
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
  const modules = await getResolvedModules(bundle);

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, ['test']);
  t.assert(Object.keys(modules).includes(resolve('only-local.js')));
});
