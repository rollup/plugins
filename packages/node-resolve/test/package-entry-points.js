const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('handles export map shorthand', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with fallback', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with top level mappings', async (t) => {
  const bundle = await rollup({
    input: 'exports-top-level-mappings.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.main, 'MAIN MAPPED');
  t.is(module.exports.foo, 'FOO MAPPED');
});

test('handles export map with top level conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-top-level-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles export map with nested conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-nested-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles conditions with a fallback', async (t) => {
  const bundle = await rollup({
    input: 'exports-conditions-fallback.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN MAPPED');
});

test('handles top level mappings with conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-mappings-and-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.main, 'MAIN MAPPED');
  t.is(module.exports.foo, 'FOO MAPPED');
  t.is(module.exports.bar, 'BAR MAPPED');
});

test('handles directory exports', async (t) => {
  const bundle = await rollup({
    input: 'exports-directory.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.a, 'exported-foo a');
  t.is(module.exports.b, 'exported-foo b');
  t.is(module.exports.c, 'exported-foo c');
});

test('handles main directory exports', async (t) => {
  const bundle = await rollup({
    input: 'exports-main-directory.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.a, 'exported a');
  t.is(module.exports.b, 'exported b');
  t.is(module.exports.c, 'exported c');
});

test('logs a warning when using shorthand and importing a subpath', async (t) => {
  t.plan(1);
  const errors = [];
  await rollup({
    input: 'exports-shorthand-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(errors[0].message.includes('Could not resolve import "exports-shorthand/foo" in '));
});

test('logs a warning when a subpath cannot be found', async (t) => {
  t.plan(1);
  const errors = [];
  await rollup({
    input: 'exports-non-existing-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(
    errors[0].message.includes('Could not resolve import "exports-non-existing-subpath/bar" in ')
  );
});

test('prevents importing files not specified in exports map', async (t) => {
  t.plan(1);
  const errors = [];
  await rollup({
    input: 'exports-prevent-unspecified-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });

  t.true(
    errors[0].message.includes('Could not resolve import "exports-top-level-mappings/bar" in ')
  );
});

test('uses "require" condition when a module is referenced with require', async (t) => {
  const bundle = await rollup({
    input: 'exports-cjs.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [commonjs(), nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'CJS');
});

test('can use star pattern in exports field', async (t) => {
  const bundle = await rollup({
    input: 'exports-star.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, { a: 'A', b: 'B', c: 'C' });
});

test('the most specific star pattern matches', async (t) => {
  const bundle = await rollup({
    input: 'exports-star-specificity.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    a1: 'foo-one a',
    a2: 'foo-two a',
    a3: 'foo-three a'
  });
});

test('a literal match takes presedence', async (t) => {
  const bundle = await rollup({
    input: 'exports-literal-specificity.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, { a: 'foo a' });
});

test('the most specific directory mapping pattern matches', async (t) => {
  const bundle = await rollup({
    input: 'exports-directory-specificity.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    a1: 'foo-one a',
    a2: 'foo-two a',
    a3: 'foo-three a'
  });
});

test('can resolve fallback with conditions', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, 'MAIN MAPPED');
});

test('can resolve fallback with errors', async (t) => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback-error.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, 'MAIN MAPPED');
});

test('can resolve a package import to a relative file', async (t) => {
  const bundle = await rollup({
    input: 'imports-relative.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, 'imports-relative imported ./src/foo');
});

test('can resolve a package import to a bare import', async (t) => {
  const bundle = await rollup({
    input: 'imports-bare.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, 'imports-bare imported imports-bare-dependency');
});

test('can resolve a package import with conditions', async (t) => {
  const bundle = await rollup({
    input: 'imports-conditions.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, 'imports-conditions imported ./src/foo.mjs');
});

test('can resolve a package import with a pattern', async (t) => {
  const bundle = await rollup({
    input: 'imports-pattern.js',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    a: './src/a.js',
    b: './src/b.js',
    fooA: './foo/x-a.js',
    fooB: './foo/x-b.js'
  });
});

test('can override a star pattern using null', async (t) => {
  const errors = [];
  const bundle = await rollup({
    input: 'exports-null-override.js',
    onwarn: (e) => {
      errors.push(e);
    },
    plugins: [nodeResolve()]
  });
  await testBundle(t, bundle);

  t.true(errors[0].message.includes('Could not resolve import "exports-null-override/foo/a" in '));
});

test('can self-import a package when using exports field', async (t) => {
  const bundle = await rollup({
    // TODO previously this worked because we'd do this internally
    input: './self-package-import',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    a: 'a',
    b: 'b'
  });
});

test('does not warn when resolving typescript imports with fallback', async (t) => {
  const bundle = await rollup({
    input: 'exports-ts-fallback.ts',
    onwarn: () => {
      t.fail('No warnings were expected');
    },
    plugins: [nodeResolve({ extensions: ['.js', '.ts'] })]
  });
  const { module } = await testBundle(t, bundle);

  t.deepEqual(module.exports, {
    a: 'A'
  });
});
