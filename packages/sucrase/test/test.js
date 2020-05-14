const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const sucrase = require('..');

require('source-map-support').install();

process.chdir(__dirname);

test('converts jsx', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/jsx/main.js',
    plugins: [
      sucrase({
        transforms: ['jsx']
      })
    ]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('converts jsx with custom jsxPragma', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/jsx/main.js',
    plugins: [
      sucrase({
        transforms: ['jsx'],
        jsxPragma: 'FakeReactCreateElement'
      })
    ]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('converts typescript', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/typescript/main.js',
    plugins: [
      sucrase({
        transforms: ['typescript']
      })
    ]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('resolves typescript directory imports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/typescript-resolve-directory/main.js',
    plugins: [
      sucrase({
        transforms: ['typescript']
      })
    ]
  });
  t.plan(2);
  return testBundle(t, bundle);
});
