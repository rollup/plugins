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
test('respects order if given module,jsnext:main,main', async () => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['module', 'jsnext:main', 'main'],
        preferBuiltins: false
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MODULE-ENTRY');
});
test('prefer module field by default', async () => {
  const bundle = await rollup({
    input: 'prefer-module.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        preferBuiltins: false
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MODULE-ENTRY');
});
test('finds and uses a dual-distributed .js & .mjs module', async () => {
  const bundle = await rollup({
    input: 'dual-cjs-mjs.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        preferBuiltins: false
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('DUAL-MJS');
});
test('respects order if given jsnext:main, main', async () => {
  const bundle = await rollup({
    input: 'prefer-jsnext.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['jsnext:main', 'main'],
        preferBuiltins: false
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('JSNEXT-ENTRY');
});
