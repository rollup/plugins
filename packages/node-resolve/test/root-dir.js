const avaAssertions = {
  is(actual, expected, message) {
    expect(actual, message).toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, message).toEqual(expected);
  }
};

const { join } = require('path');

const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');
const { nodeResolve } = require('..');

test('deduplicates modules from the given root directory', async () => {
  const bundle = await rollup({
    input: './packages/package-a/index.js',
    plugins: [
      nodeResolve({
        dedupe: ['react'],
        rootDir: join(__dirname, 'fixtures', 'monorepo-dedupe')
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
