const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const legacy = require('..');

process.chdir(__dirname);

test('adds a default export', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/default-export/main.js',
    plugins: [
      legacy({
        './fixtures/default-export/answer.js': 'answer'
      })
    ]
  });
  t.plan(1);
  await testBundle(t, bundle);
});

test('adds a changed named export', async (t) => {
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
  t.plan(1);
  await testBundle(t, bundle);
});

test('adds a nested named export', async (t) => {
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
  t.plan(1);
  await testBundle(t, bundle);
});

test('adds a unchanged named export', async (t) => {
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
  t.plan(1);
  await testBundle(t, bundle);
});
