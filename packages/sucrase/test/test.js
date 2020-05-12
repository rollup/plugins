const path = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const sucrase = require('..');
const alias = require('../../alias');

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
