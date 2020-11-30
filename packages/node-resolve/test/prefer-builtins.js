const { join, resolve } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { getImports, testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('handles importing builtins', async (t) => {
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

  const { module } = await testBundle(t, bundle);

  t.is(warnings.length, 0);
  // eslint-disable-next-line global-require
  t.is(module.exports, require('path').sep);
});

test('warning when preferring a builtin module, no explicit configuration', async (t) => {
  let warning = null;
  await rollup({
    input: 'prefer-builtin.js',
    onwarn({ message }) {
      // eslint-disable-next-line no-bitwise
      if (~message.indexOf('preferring')) {
        warning = message;
      }
    },
    plugins: [nodeResolve()]
  });

  const localPath = resolve('node_modules/events/index.js');
  t.is(
    warning,
    `preferring built-in module 'events' over local alternative ` +
      `at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
      `or 'preferBuiltins: true' to disable this warning`
  );
});

test('true allows preferring a builtin to a local module of the same name', async (t) => {
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

  t.is(warnings.length, 0);
  t.deepEqual(imports, ['events']);
});

test('false allows resolving a local module with the same name as a builtin module', async (t) => {
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

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, []);
});
