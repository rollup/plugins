const { join } = require('path');

const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');

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
test('disregards top-level browser field', async () => {
  const bundle = await rollup({
    input: 'browser.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('node');
});
test('allows use of the top-level browser field', async () => {
  const bundle = await rollup({
    input: 'browser.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('browser');
});
test('disregards object browser field', async () => {
  const bundle = await rollup({
    input: 'browser-object.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('node');
  expect(module.exports.dep).toBe('node-dep');
  expect(module.exports.test).toBe(42);
});
test('allows use of the object browser field', async () => {
  const bundle = await rollup({
    input: 'browser-object.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('browser');
  expect(module.exports.dep).toBe('browser-dep');
  expect(module.exports.test).toBe(43);
});
test('allows use of object browser field, resolving `main`', async () => {
  const bundle = await rollup({
    input: 'browser-object-main.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('browser');
  expect(module.exports.dep).toBe('browser-dep');
  expect(module.exports.test).toBe(43);
});
test('options.browser = true still works', async () => {
  const bundle = await rollup({
    input: 'browser-object-main.js',
    plugins: [
      nodeResolve({
        browser: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('browser');
  expect(module.exports.dep).toBe('browser-dep');
  expect(module.exports.test).toBe(43);
});
test('allows use of object browser field, resolving implicit `main`', async () => {
  const bundle = await rollup({
    input: 'browser-object-implicit.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('browser');
});
test('allows use of object browser field, resolving replaced builtins', async () => {
  const bundle = await rollup({
    input: 'browser-object-builtin.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('browser-fs');
});
test('allows use of object browser field, resolving nested directories', async () => {
  const bundle = await rollup({
    input: 'browser-object-nested.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.env).toBe('browser');
  expect(module.exports.dep).toBe('browser-dep');
  expect(module.exports.test).toBe(43);
});
test('respects local browser field for external dependencies', async () => {
  const bundle = await rollup({
    input: 'browser-local.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('component-type');
});
test('respects local browser field for internal dependencies', async () => {
  const bundle = await rollup({
    input: 'browser-local-relative.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('component-type');
});
test('does not apply local browser field for matching imports in nested paths', async () => {
  try {
    await rollup({
      input: 'nested/browser-local-relative.js',
      onwarn: () => expect.unreachable('No warnings were expected'),
      plugins: [
        nodeResolve({
          mainFields: ['browser', 'main']
        })
      ]
    });
  } catch (e) {
    expect(e.code).toBe('UNRESOLVED_IMPORT');
    return;
  }
  expect.unreachable('expecting error');
});
test('allows use of object browser field, resolving to nested node_modules', async () => {
  const bundle = await rollup({
    input: 'browser-entry-points-to-node-module.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        main: true,
        browser: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('component-type');
});
test('supports `false` in browser field', async () => {
  const bundle = await rollup({
    input: 'browser-false.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main']
      })
    ]
  });
  await testBundle(avaAssertions, bundle);
});
test('pkg.browser with mapping to prevent bundle by specifying a value of false', async () => {
  const bundle = await rollup({
    input: 'browser-object-with-false.js',
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs()
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('ok');
});
test('exports.browser can be mapped via pkg.browser', async () => {
  const bundle = await rollup({
    input: 'browser-exports-browser-browser.js',
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs()
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('browser');
});
test('browser field does not take precedence over export map result', async () => {
  const bundle = await rollup({
    input: 'browser-exports-browser.js',
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs()
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('require');
});
