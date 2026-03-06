const path = require('path');

const { rollup } = require('rollup');

const { normalizePath } = require('@rollup/pluginutils');

const { testBundle } = require('../../../util/test');

const legacy = require('..');

process.chdir(__dirname);

test('adds a default export', async () => {
  const bundle = await rollup({
    input: 'fixtures/default-export/main.js',
    plugins: [
      legacy({
        './fixtures/default-export/answer.js': 'answer'
      })
    ]
  });
  await testBundle(undefined, bundle);
});

test('adds a changed named export', async () => {
  const bundle = await rollup({
    input: 'fixtures/named-exports-changed/main.js',
    plugins: [
      legacy({
        './fixtures/named-exports-changed/answer.js': {
          answer: 'answerToLifeTheUniverseAndEverything'
        }
      })
    ]
  });
  await testBundle(undefined, bundle);
});

test('adds a nested named export', async () => {
  const bundle = await rollup({
    input: 'fixtures/named-exports-nested/main.js',
    plugins: [
      legacy({
        './fixtures/named-exports-nested/answer.js': {
          answer: 'obj.answer'
        }
      })
    ]
  });
  await testBundle(undefined, bundle);
});

test('adds a unchanged named export', async () => {
  const bundle = await rollup({
    input: 'fixtures/named-exports-unchanged/main.js',
    plugins: [
      legacy({
        './fixtures/named-exports-unchanged/answer.js': {
          answer: 'answer'
        }
      })
    ]
  });
  await testBundle(undefined, bundle);
});

test('normalized paths', async () => {
  const bundle = await rollup({
    input: 'fixtures/default-export/main.js',
    plugins: [
      {
        name: 'NormalizedPath',
        resolveId(importee) {
          if (importee === './answer') {
            return normalizePath(path.resolve('./fixtures/default-export/answer.js'));
          }
          return null;
        }
      },
      legacy({
        './fixtures/default-export/answer.js': 'answer'
      })
    ]
  });
  await testBundle(undefined, bundle);
});
