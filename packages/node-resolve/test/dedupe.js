const { join } = require('path');

const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');
const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));
const avaAssertions = {
  is(actual, expected, message) {
    expect(actual, message).toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, message).toEqual(expected);
  }
};
test('single module version is bundled if dedupe is set', async () => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: ['react']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
test('dedupes deep imports by package name if dedupe is set', async () => {
  const bundle = await rollup({
    input: 'react-app-deep-import.js',
    plugins: [
      nodeResolve({
        dedupe: ['react']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
test('dedupes scoped deep imports by package name if dedupe is set', async () => {
  const bundle = await rollup({
    input: 'scoped-deep-import.js',
    plugins: [
      nodeResolve({
        dedupe: ['@scoped/deduped']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
test('single module version is bundled if dedupe is set as a function', async () => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [
      nodeResolve({
        dedupe: (dep) => dep === 'react'
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
test('multiple module versions are bundled if dedupe is not set', async () => {
  const bundle = await rollup({
    input: 'react-app.js',
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toMatchSnapshot();
});
