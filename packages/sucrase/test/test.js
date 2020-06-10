const path = require('path');

const test = require('ava');
const { rollup } = require('rollup');

// eslint-disable-next-line import/no-unresolved, import/extensions
const alias = require('@rollup/plugin-alias');

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

test('converts typescript with aliases', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/typescript-with-aliases/main.js',
    plugins: [
      sucrase({
        transforms: ['typescript']
      }),
      alias({
        entries: [
          {
            find: '~src',
            replacement: path.resolve(__dirname, 'fixtures', 'typescript-with-aliases', 'src')
          }
        ]
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

test('converts typescript jsx', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/typescript-with-tsx/main.js',
    plugins: [
      sucrase({
        transforms: ['typescript', 'jsx']
      })
    ]
  });
  t.plan(1);

  return testBundle(t, bundle);
});
