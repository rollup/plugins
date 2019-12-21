const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures', 'monorepo-dedupe', 'packages', 'package-a'));

test.only('deduplicates modules from the given root directory', async (t) => {
  const bundle = await rollup({
    input: 'index.js',
    plugins: [
      nodeResolve({
        dedupe: ['react'],
        rootDir: join(__dirname, 'fixtures', 'monorepo-dedupe')
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});
