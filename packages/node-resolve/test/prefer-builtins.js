const { join, resolve } = require('path');

const { rollup } = require('rollup');

const { getImports, testBundle } = require('../../../util/test');
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
test('handles importing builtins', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'builtins.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        mainFields: ['browser', 'main'],
        preferBuiltins: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(warnings.length).toBe(0);
  // eslint-disable-next-line global-require
  expect(module.exports).toBe(require('path').sep);
});
test('warning when preferring a builtin module, no explicit configuration', async () => {
  let warning = '';
  await rollup({
    input: 'prefer-builtin.js',
    onwarn({ message, pluginCode }) {
      if (pluginCode === 'PREFER_BUILTINS') {
        warning += message;
      }
    },
    plugins: [nodeResolve()]
  });
  const localPath = resolve('node_modules/events/index.js');
  expect(warning).toBe(
    `preferring built-in module 'events' over local alternative ` +
      `at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
      `or 'preferBuiltins: true' to disable this warning.` +
      `or passing a function to 'preferBuiltins' to provide more fine-grained control over which built-in modules to prefer.`
  );
});
test('true allows preferring a builtin to a local module of the same name', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'prefer-builtin.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        preferBuiltins: true
      })
    ]
  });
  const imports = await getImports(bundle);
  expect(warnings.length).toBe(0);
  expect(imports).toEqual(['events']);
});
test('true prefers a local module to a builtin of the same name when imported with a trailing slash', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'prefer-local.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        preferBuiltins: true
      })
    ]
  });
  const imports = await getImports(bundle);
  expect(warnings.length).toBe(0);
  expect(imports).toEqual([]);
});
test('false allows resolving a local module with the same name as a builtin module', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'prefer-builtin.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        preferBuiltins: false
      })
    ]
  });
  const imports = await getImports(bundle);
  expect(warnings.length).toBe(1);
  expect(warnings).toMatchSnapshot();
  expect(imports).toEqual([]);
});
test('does not warn when using a builtin module when there is no local version, no explicit configuration', async () => {
  let warning = null;
  await rollup({
    input: 'prefer-builtin-no-local.js',
    onwarn({ message }) {
      // eslint-disable-next-line no-bitwise
      if (~message.indexOf('preferring')) {
        warning = message;
      }
    },
    plugins: [nodeResolve()]
  });
  expect(warning).toBe(null);
});
test('detects builtins imported with node: protocol', async () => {
  const warnings = [];
  await rollup({
    input: 'node-protocol.js',
    onwarn({ message }) {
      warnings.push(message);
    },
    plugins: [nodeResolve()]
  });
  expect(warnings.length).toBe(0);
});
test('accpet passing a function to determine which builtins to prefer', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'prefer-builtin-local-and-builtin.js',
    onwarn({ message }) {
      warnings.push(message);
    },
    plugins: [
      nodeResolve({
        preferBuiltins: (id) => id !== 'events'
      })
    ]
  });
  const {
    module: { exports }
  } = await testBundle(avaAssertions, bundle);
  expect(warnings.length).toBe(0);
  expect(exports.sep).toBe(require('node:path').sep);
  expect(exports.events).not.toBe(require('node:events'));
  expect(exports.events).toBe('not the built-in events module');
});
