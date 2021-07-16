import { join, resolve } from 'path';

import test from 'ava';
import { rollup } from 'rollup';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';

import { getCode, getImports, testBundle } from '../../../util/test';

import { nodeResolve } from '..';

process.chdir(join(__dirname, 'fixtures'));

test('finds a module with jsnext:main', async (t) => {
  const bundle = await rollup({
    input: 'jsnext.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'] })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'JSNEXT');
});

test('finds and converts a basic CommonJS module', async (t) => {
  const bundle = await rollup({
    input: 'commonjs.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'It works!');
});

test('handles a trailing slash', async (t) => {
  const bundle = await rollup({
    input: 'trailing-slash.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'It works!');
});

test('finds a file inside a package directory', async (t) => {
  const bundle = await rollup({
    input: 'granular.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 6
              }
            }
          ]
        ]
      })
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'FOO');
});

test('loads local directories by finding index.js within them', async (t) => {
  const bundle = await rollup({
    input: 'local-index/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 42);
});

test('loads package directories by finding index.js within them', async (t) => {
  const bundle = await rollup({
    input: 'package-index.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const code = await getCode(bundle);

  t.truthy(code.indexOf('setPrototypeOf'));
});

test('supports non-standard extensions', async (t) => {
  const bundle = await rollup({
    input: 'extensions/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        extensions: ['.js', '.wut']
      })
    ]
  });
  await testBundle(t, bundle);
});

test('supports JS extensions in TS when referring to TS imports', async (t) => {
  const bundle = await rollup({
    input: 'ts-import-js-extension/import-ts-with-js-extension.ts',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts']
      }),
      babel({
        babelHelpers: 'bundled',
        plugins: ['@babel/plugin-transform-typescript'],
        extensions: ['.js', '.ts']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'It works!');
});

test('handles package.json being a directory earlier in the path', async (t) => {
  const bundle = await rollup({
    input: 'package-json-in-path/package.json/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        extensions: ['.js']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'It works!');
});

test('ignores IDs with null character', async (t) => {
  const result = await nodeResolve().resolveId('\0someid', 'test.js');
  t.is(result, null);
});

test('finds and uses an .mjs module', async (t) => {
  const bundle = await rollup({
    input: 'module-mjs.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MODULE-MJS');
});

test('supports ./ in entry filename', async (t) => {
  const bundle = await rollup({
    input: './jsnext.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({})]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MAIN');
});

test('throws error if local id is not resolved', async (t) => {
  t.plan(1);
  try {
    await rollup({
      input: 'unresolved-local.js',
      onwarn: () => t.fail('No warnings were expected'),
      plugins: [nodeResolve()]
    });
  } catch (e) {
    t.snapshot(e.message);
  }
});

test('allows custom moduleDirectories', async (t) => {
  const bundle = await rollup({
    input: 'custom-module-dir/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        moduleDirectories: ['js_modules']
      })
    ]
  });

  t.is(bundle.cache.modules[0].id, resolve('custom-module-dir/js_modules/foo.js'));
});

test('allows custom moduleDirectories with legacy customResolveOptions.moduleDirectory', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'custom-module-dir/main.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        customResolveOptions: {
          moduleDirectory: 'js_modules'
        }
      })
    ]
  });

  t.is(bundle.cache.modules[0].id, resolve('custom-module-dir/js_modules/foo.js'));
  t.is(warnings.length, 1);
  t.snapshot(warnings);
});

test('ignores deep-import non-modules', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'deep-import-non-module.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        modulesOnly: true
      })
    ]
  });
  const imports = await getImports(bundle);

  t.is(warnings.length, 1);
  t.snapshot(warnings);
  t.deepEqual(imports, ['foo/deep']);
});

test('generates manual chunks', async (t) => {
  const chunkName = 'mychunk';
  const bundle = await rollup({
    input: 'manualchunks.js',
    onwarn: () => t.fail('No warnings were expected'),
    manualChunks: {
      [chunkName]: ['simple']
    },
    plugins: [nodeResolve()]
  });

  const { output } = await bundle.generate({
    format: 'esm',
    chunkFileNames: '[name]'
  });

  t.truthy(output.find(({ fileName }) => fileName === chunkName));
});

test('resolves dynamic imports', async (t) => {
  const bundle = await rollup({
    input: 'dynamic.js',
    onwarn: () => t.fail('No warnings were expected'),
    inlineDynamicImports: true,
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);
  const result = await module.exports;
  t.is(result.default, 42);
});

test('respects the package.json sideEffects property for files in root package by default', async (t) => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    plugins: [
      nodeResolve({
        rootDir: 'root-package-side-effect'
      })
    ]
  });

  const code = await getCode(bundle);
  t.false(code.includes('side effect'));
  t.snapshot(code);
});

test('ignores the package.json sideEffects property for files in root package with "ignoreSideEffectsForRoot" option', async (t) => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    plugins: [
      nodeResolve({
        rootDir: 'root-package-side-effect',
        ignoreSideEffectsForRoot: true
      })
    ]
  });

  const code = await getCode(bundle);
  t.true(code.includes('side effect'));
  t.snapshot(code);
});

test('handles package side-effects', async (t) => {
  const bundle = await rollup({
    input: 'side-effects.js',
    plugins: [nodeResolve()]
  });
  await testBundle(t, bundle);
  t.snapshot(global.sideEffects);

  delete global.sideEffects;
});

test('can resolve imports with hash in path', async (t) => {
  const bundle = await rollup({
    input: 'hash-in-path.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (id === resolve(__dirname, 'fixtures', 'node_modules', 'test', '#', 'foo.js')) {
            return 'export default "resolved with hash"';
          }
          return null;
        }
      }
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'resolved with hash');
});

test('can resolve imports with search params', async (t) => {
  const bundle = await rollup({
    input: 'search-params.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (
            id ===
            resolve(__dirname, 'fixtures', 'node_modules', 'test', 'index.js?foo=bar&lorem=ipsum')
          ) {
            return 'export default "resolved with search params"';
          }
          return null;
        }
      }
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'resolved with search params');
});

test('can resolve imports with search params and hash', async (t) => {
  const bundle = await rollup({
    input: 'search-params-and-hash.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (
            id ===
            resolve(
              __dirname,
              'fixtures',
              'node_modules',
              'test',
              'index.js?foo=bar&lorem=ipsum#foo'
            )
          ) {
            return 'export default "resolved with search params and hash"';
          }
          return null;
        }
      }
    ]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'resolved with search params and hash');
});

test('marks a module as external if the resolved version is external', async (t) => {
  const bundle = await rollup({
    input: 'resolved-external/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    external: [/node_modules/],
    plugins: [nodeResolve()]
  });

  const code = await getCode(bundle);
  t.is(/node_modules/.test(code), false);
});

[
  'preserveSymlinks',
  'basedir',
  'package',
  'extensions',
  'includeCoreModules',
  'readFile',
  'isFile',
  'isDirectory',
  'realpath',
  'packageFilter',
  'pathFilter',
  'paths',
  'packageIterator'
].forEach((resolveOption) => {
  test(`throws error for removed customResolveOptions.${resolveOption} option`, (t) => {
    try {
      nodeResolve({
        customResolveOptions: {
          [resolveOption]: 'something'
        }
      });
    } catch (e) {
      t.snapshot(e);
      return;
    }
    t.fail('expecting error');
  });
});
