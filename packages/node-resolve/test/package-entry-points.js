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
test('handles export map shorthand', async () => {
  const bundle = await rollup({
    input: 'exports-shorthand.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN MAPPED');
});
test('handles export map with fallback', async () => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN MAPPED');
});
test('handles export map with pattern and extensions', async () => {
  const bundle = await rollup({
    input: 'exports-pattern-extension.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.foo).toBe('foo');
});
test('handles export map with top level mappings', async () => {
  const bundle = await rollup({
    input: 'exports-top-level-mappings.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.main).toBe('MAIN MAPPED');
  expect(module.exports.foo).toBe('FOO MAPPED');
});
test('handles export map with top level conditions', async () => {
  const bundle = await rollup({
    input: 'exports-top-level-conditions.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN MAPPED');
});
test('handles export map with nested conditions', async () => {
  const bundle = await rollup({
    input: 'exports-nested-conditions.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN MAPPED');
});
test('handles conditions with a fallback', async () => {
  const bundle = await rollup({
    input: 'exports-conditions-fallback.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN MAPPED');
});
test('handles top level mappings with conditions', async () => {
  const bundle = await rollup({
    input: 'exports-mappings-and-conditions.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.main).toBe('MAIN MAPPED');
  expect(module.exports.foo).toBe('FOO MAPPED');
  expect(module.exports.bar).toBe('BAR MAPPED');
});
test('handles directory exports', async () => {
  const bundle = await rollup({
    input: 'exports-directory.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.a).toBe('exported-foo a');
  expect(module.exports.b).toBe('exported-foo b');
  expect(module.exports.c).toBe('exported-foo c');
});
test('handles main directory exports', async () => {
  const bundle = await rollup({
    input: 'exports-main-directory.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.a).toBe('exported a');
  expect(module.exports.b).toBe('exported b');
  expect(module.exports.c).toBe('exported c');
});
test('logs a warning when using shorthand and importing a subpath', async () => {
  expect.assertions(1);
  const errors = [];
  await rollup({
    input: 'exports-shorthand-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });
  expect(errors[0].message.includes('Could not resolve import "exports-shorthand/foo" in ')).toBe(
    true
  );
});
test('logs a warning when a subpath cannot be found', async () => {
  expect.assertions(1);
  const errors = [];
  await rollup({
    input: 'exports-non-existing-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });
  expect(
    errors[0].message.includes('Could not resolve import "exports-non-existing-subpath/bar" in ')
  ).toBe(true);
});
test('prevents importing files not specified in exports map', async () => {
  expect.assertions(1);
  const errors = [];
  await rollup({
    input: 'exports-prevent-unspecified-subpath.js',
    onwarn: (error) => {
      errors.push(error);
    },
    plugins: [nodeResolve()]
  });
  expect(
    errors[0].message.includes('Could not resolve import "exports-top-level-mappings/bar" in ')
  ).toBe(true);
});
test('uses "require" condition when a module is referenced with require', async () => {
  const bundle = await rollup({
    input: 'exports-cjs.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [commonjs(), nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('CJS');
});
test('can use star pattern in exports field', async () => {
  const bundle = await rollup({
    input: 'exports-star.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: 'A',
    b: 'B',
    c: 'C'
  });
});
test('the most specific star pattern matches', async () => {
  const bundle = await rollup({
    input: 'exports-star-specificity.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a1: 'foo-one a',
    a2: 'foo-two a',
    a3: 'foo-three a'
  });
});
test('a literal match takes presedence', async () => {
  const bundle = await rollup({
    input: 'exports-literal-specificity.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: 'foo a'
  });
});
test('the most specific directory mapping pattern matches', async () => {
  const bundle = await rollup({
    input: 'exports-directory-specificity.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a1: 'foo-one a',
    a2: 'foo-two a',
    a3: 'foo-three a'
  });
});
test('can resolve fallback with conditions', async () => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback-conditions.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('MAIN MAPPED');
});
test('can resolve fallback with errors', async () => {
  const bundle = await rollup({
    input: 'exports-shorthand-fallback-error.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('MAIN MAPPED');
});
test('can resolve a package import to a relative file', async () => {
  const bundle = await rollup({
    input: 'imports-relative.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('imports-relative imported ./src/foo');
});
test('can resolve a package import to a bare import', async () => {
  const bundle = await rollup({
    input: 'imports-bare.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('imports-bare imported imports-bare-dependency');
});
test('can resolve a package import with conditions', async () => {
  const bundle = await rollup({
    input: 'imports-conditions.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('imports-conditions imported ./src/foo.mjs');
});
test('can resolve a package import with a pattern', async () => {
  const bundle = await rollup({
    input: 'imports-pattern.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: './src/a.js',
    b: './src/b.js',
    fooA: './foo/x-a.js',
    fooB: './foo/x-b.js'
  });
});
test('can resolve a package import pattern to a bare package that uses exports', async () => {
  const bundle = await rollup({
    input: 'imports-bare-pattern-exports.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: 'exported-foo a',
    b: 'exported-foo b',
    c: 'exported-foo c'
  });
});
test('can override a star pattern using null', async () => {
  const errors = [];
  const bundle = await rollup({
    input: 'exports-null-override.js',
    onwarn: (e) => {
      errors.push(e);
    },
    plugins: [nodeResolve()]
  });
  await testBundle(avaAssertions, bundle);
  expect(
    errors[0].message.includes('Could not resolve import "exports-null-override/foo/a" in ')
  ).toBe(true);
});
test('can self-import a package when using exports field', async () => {
  const bundle = await rollup({
    input: 'self-package-import.js',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: 'a',
    b: 'b'
  });
});
test('does not warn when resolving typescript imports with fallback', async () => {
  const bundle = await rollup({
    input: 'exports-ts-fallback.ts',
    onwarn: () => {
      expect.unreachable('No warnings were expected');
    },
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual({
    a: 'A'
  });
});
test('custom condition takes precedence over browser field and condition with `browser: true`', async () => {
  const bundle = await rollup({
    input: 'exports-worker-condition-with-browser-field.js',
    plugins: [
      nodeResolve({
        exportConditions: ['browser', 'webworker'],
        browser: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('FROM WEBWORKER CONDITION');
});
test('custom condition takes precedence over browser field with `browser: true`', async () => {
  const bundle = await rollup({
    input: 'exports-only-worker-condition-with-browser-field.js',
    plugins: [
      nodeResolve({
        exportConditions: ['browser', 'webworker'],
        browser: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('FROM WEBWORKER CONDITION');
});
test('development condition is used when NODE_ENV is not production', async () => {
  const bundle = await rollup({
    input: 'dev-prod-conditions.js',
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toEqual('DEV');
});
