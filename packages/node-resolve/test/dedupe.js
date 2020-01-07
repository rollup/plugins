const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('single module version is bundled if dedupe is set', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: ['react']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});

test('dedupes deep imports by package name if dedupe is set', async (t) => {
  const bundle = await rollup({
    input: 'react-app-deep-import.js',
    plugins: [
      nodeResolve({
        dedupe: ['react']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});

test('dedupes scoped deep imports by package name if dedupe is set', async (t) => {
  const bundle = await rollup({
    input: 'scoped-deep-import.js',
    plugins: [
      nodeResolve({
        dedupe: ['@scoped/deduped']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});

test('single module version is bundled if dedupe is set as a function', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: (dep) => dep === 'react'
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});

test('multiple module versions are bundled if dedupe is not set', async (t) => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});
