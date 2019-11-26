const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('single module version is bundle if dedupe is set', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: ['react']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    React: 'react:root',
    ReactConsumer: 'react-consumer:react:root'
  });
});

test('single module version is bundle if dedupe is set as a function', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: (dep) => dep === 'react'
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    React: 'react:root',
    ReactConsumer: 'react-consumer:react:root'
  });
});

test('multiple module versions are bundled if dedupe is not set', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    React: 'react:root',
    ReactConsumer: 'react-consumer:react:child'
  });
});
