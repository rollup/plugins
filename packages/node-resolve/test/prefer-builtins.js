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
  t.is(
    warning,
    `preferring built-in module 'events' over local alternative ` +
      `at '${localPath}', pass 'preferBuiltins: false' to disable this behavior ` +
      `or 'preferBuiltins: true' to disable this warning.` +
      `or passing a function to 'preferBuiltins' to provide more fine-grained control over which built-in modules to prefer.`
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

test('true prefers a local module to a builtin of the same name when imported with a trailing slash', async (t) => {
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

  t.is(warnings.length, 0);
  t.deepEqual(imports, []);
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

test('does not warn when using a builtin module when there is no local version, no explicit configuration', async (t) => {
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

  t.is(warning, null);
});

test('detects builtins imported with node: protocol', async (t) => {
  const warnings = [];
  await rollup({
    input: 'node-protocol.js',
    onwarn({ message }) {
      warnings.push(message);
    },
    plugins: [nodeResolve()]
  });

  t.is(warnings.length, 0);
});

test('accpet passing a function to determine which builtins to prefer', async (t) => {
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
  } = await testBundle(t, bundle);

  t.is(warnings.length, 0);
  t.is(exports.sep, require('node:path').sep);
  t.not(exports.events, require('node:events'));
  t.is(exports.events, 'not the built-in events module');
});
