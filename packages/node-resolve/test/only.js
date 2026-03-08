const { join, resolve } = require('path');

const { rollup } = require('rollup');

const { getImports, getResolvedModules } = require('../../../util/test');
const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));
test('specify the only packages to resolve', async () => {
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
  expect(warnings.length).toBe(0);
  expect(warnings).toMatchSnapshot();
  expect(imports).toEqual(['@scoped/foo', '@scoped/bar']);
  expect(Object.keys(modules).includes(resolve('only-local.js'))).toBeTruthy();
});
test('handles nested entry modules', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: ['nested/only.js'],
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        resolveOnly: ['test']
      })
    ]
  });
  const imports = await getImports(bundle);
  const modules = await getResolvedModules(bundle);
  expect(warnings.length).toBe(0);
  expect(warnings).toMatchSnapshot();
  expect(imports).toEqual(['@scoped/foo', '@scoped/bar']);
  expect(Object.keys(modules).includes(resolve('only-local.js'))).toBeTruthy();
});
test('regex', async () => {
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
  expect(warnings.length).toBe(0);
  expect(warnings).toMatchSnapshot();
  expect(imports).toEqual(['test']);
  expect(Object.keys(modules).includes(resolve('only-local.js'))).toBeTruthy();
});
test('allows a function as the parameter', async () => {
  function allowed(...modules) {
    const set = new Set(modules);
    return (id) => set.has(id);
  }
  const warnings = [];
  const bundle = await rollup({
    input: ['only.js'],
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        resolveOnly: allowed('test')
      })
    ]
  });
  const imports = await getImports(bundle);
  const modules = await getResolvedModules(bundle);
  expect(warnings.length).toBe(0);
  expect(warnings).toMatchSnapshot();
  expect(imports).toEqual(['@scoped/foo', '@scoped/bar']);
  expect(Object.keys(modules).includes(resolve('only-local.js'))).toBeTruthy();
});
