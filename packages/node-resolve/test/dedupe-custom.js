const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures', 'custom-resolve-options'));

test('can deduplicate custom module directory', async (t) => {
  const bundle = await rollup({
    input: 'dedupe.js',
    plugins: [
      nodeResolve({
        dedupe: ['package-b'],
        customResolveOptions: {
          moduleDirectory: 'js_modules'
        }
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.snapshot(module.exports);
});
