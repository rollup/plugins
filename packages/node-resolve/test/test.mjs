import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import test from 'ava';
import { rollup } from 'rollup';

import { nodeResolve } from 'current-package';

import { evaluateBundle, getCode, getImports, testBundle } from '../../../util/test.js';

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));
process.chdir(join(DIRNAME, 'fixtures'));

const failOnWarn = (t) => (warning) =>
  t.fail(`No warnings were expected, got:\n${warning.code}\n${warning.message}`);

const getLastPathFragment = (path) => path && path.split(/[\\/]/).slice(-1)[0];

test('exposes plugin version', (t) => {
  const plugin = nodeResolve();
  t.regex(plugin.version, /^\d+\.\d+\.\d+/);
});

test('finds a module with jsnext:main', async (t) => {
  const bundle = await rollup({
    input: 'jsnext.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'] })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'JSNEXT');
});

test('finds and converts a basic CommonJS module', async (t) => {
  const bundle = await rollup({
    input: 'commonjs.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'It works!');
});

test('handles cyclic CommonJS modules', async (t) => {
  const bundle = await rollup({
    input: 'cyclic-commonjs/main.js',
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        t.fail(`Unexpected warning:\n${warning.code}\n${warning.message}`);
      }
    },
    plugins: [nodeResolve(), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports.main, 'main');
});

test('handles a trailing slash', async (t) => {
  const bundle = await rollup({
    input: 'trailing-slash.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'It works!');
});

test('finds a file inside a package directory', async (t) => {
  const bundle = await rollup({
    input: 'granular.js',
    onwarn: failOnWarn(t),
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
    onwarn: failOnWarn(t),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 42);
});

test('loads package directories by finding index.js within them', async (t) => {
  const bundle = await rollup({
    input: 'package-index.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve()]
  });
  const code = await getCode(bundle);

  t.truthy(code.indexOf('setPrototypeOf'));
});

test('supports non-standard extensions', async (t) => {
  const bundle = await rollup({
    input: 'extensions/main.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve({
        extensions: ['.js', '.wut']
      })
    ]
  });
  await testBundle(t, bundle);
});

test('does not fallback to standard node resolve algorithm if error with exports one', async (t) => {
  try {
    await rollup({
      input: 'exports-error-no-fallback/main.js',
      onwarn: failOnWarn(t),
      plugins: [
        nodeResolve({
          extensions: ['.js']
        })
      ]
    });
    t.fail('expecting throw');
  } catch {
    t.pass();
  }
});

test('supports JS extensions in TS when referring to TS imports', async (t) => {
  const bundle = await rollup({
    input: 'ts-import-js-extension/import-ts-with-js-extension.ts',
    onwarn: failOnWarn(t),
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

test('supports MJS extensions in TS when referring to MTS imports', async (t) => {
  const bundle = await rollup({
    input: 'ts-import-mjs-extension/import-ts-with-mjs-extension.ts',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts', '.mjs', '.mts']
      }),
      babel({
        babelHelpers: 'bundled',
        plugins: ['@babel/plugin-transform-typescript'],
        extensions: ['.js', '.ts', '.mjs', '.mts']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'It works!');
});

test('supports CJS extensions in TS when referring to CTS imports', async (t) => {
  const bundle = await rollup({
    input: 'ts-import-cjs-extension/import-ts-with-cjs-extension.ts',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts', '.cjs', '.cts']
      }),
      babel({
        babelHelpers: 'bundled',
        plugins: ['@babel/plugin-transform-typescript'],
        extensions: ['.js', '.ts', '.cjs', '.cts']
      })
    ]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports, 'It works!');
});

test('supports JS extensions in TS actually importing JS with export map', async (t) => {
  const bundle = await rollup({
    input: 'ts-import-js-extension-for-js-file-export-map/import-js-with-js-extension.ts',
    onwarn: failOnWarn(t),
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
    onwarn: failOnWarn(t),
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
  const result = await nodeResolve().resolveId.handler('\0someid', 'test.js', {});
  t.is(result, null);
});

test('finds and uses an .mjs module', async (t) => {
  const bundle = await rollup({
    input: 'module-mjs.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve({ preferBuiltins: false })]
  });
  const { module } = await testBundle(t, bundle);

  t.is(module.exports, 'MODULE-MJS');
});

test('supports ./ in entry filename', async (t) => {
  const bundle = await rollup({
    input: './jsnext.js',
    onwarn: failOnWarn(t),
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
      onwarn: failOnWarn(t),
      plugins: [nodeResolve()]
    });
  } catch (e) {
    t.snapshot(e.message);
  }
});

test('allows custom moduleDirectories', async (t) => {
  const bundle = await rollup({
    input: 'custom-module-dir/main.js',
    onwarn: failOnWarn(t),
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

test('moduleDirectories option rejects paths that contain a slash', async (t) => {
  t.throws(
    () =>
      nodeResolve({
        moduleDirectories: ['some/path']
      }),
    {
      message: /must only contain directory names/
    }
  );
});

test('allows custom modulePaths', async (t) => {
  const bundle = await rollup({
    input: 'custom-module-path/main.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve({
        modulePaths: [join(process.cwd(), 'custom-module-path/node_modules')]
      })
    ]
  });

  const { dependency } = await evaluateBundle(bundle);
  t.is(dependency, 'DEPENDENCY');
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
  t.deepEqual(imports, ['foo/deep']);

  t.is(warnings.length, 1, 'number of warnings');
  const [{ exporter, id }] = warnings;
  t.is(exporter, 'foo/deep', 'exporter');
  t.is(id.endsWith('deep-import-non-module.js'), true, 'id');
});

test('generates manual chunks', async (t) => {
  const chunkName = 'mychunk';
  const bundle = await rollup({
    input: 'manualchunks.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve()]
  });

  const { output } = await bundle.generate({
    format: 'es',
    chunkFileNames: '[name]',
    manualChunks: {
      [chunkName]: ['simple']
    }
  });

  t.truthy(output.find(({ fileName }) => fileName === chunkName));
});

test('resolves dynamic imports', async (t) => {
  const bundle = await rollup({
    input: 'dynamic.js',
    onwarn: failOnWarn(t),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle, { options: { inlineDynamicImports: true } });
  const result = await module.exports;
  t.is(result.default, 42);
});

test('can resolve imports with hash in path', async (t) => {
  const bundle = await rollup({
    input: 'hash-in-path.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (id === resolve(DIRNAME, 'fixtures', 'node_modules', 'test', '#', 'foo.js')) {
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
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (
            id ===
            resolve(DIRNAME, 'fixtures', 'node_modules', 'test', 'index.js?foo=bar&lorem=ipsum')
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
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        load(id) {
          if (
            id ===
            resolve(DIRNAME, 'fixtures', 'node_modules', 'test', 'index.js?foo=bar&lorem=ipsum#foo')
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
    onwarn: failOnWarn(t),
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

test('passes on "isEntry" flag', async (t) => {
  const resolveOptions = [];
  await rollup({
    input: 'entry/main.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        name: 'test',
        buildStart() {
          // A emitted chunk with an importer must not lose its "isEntry" flag after node-resolve
          this.emitFile({ type: 'chunk', importer: 'entry/main.js', id: './other.js' });
        },
        resolveId(source, importer, options) {
          resolveOptions.push([
            getLastPathFragment(source),
            getLastPathFragment(importer),
            options
          ]);
        }
      }
    ]
  });
  t.deepEqual(resolveOptions, [
    ['other.js', 'main.js', { assertions: {}, custom: {}, isEntry: true }],
    ['main.js', void 0, { assertions: {}, custom: {}, isEntry: true }],
    [
      'other.js',
      'main.js',
      {
        assertions: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'other.js'),
              moduleSideEffects: null
            }
          }
        },
        isEntry: true
      }
    ],
    [
      'main.js',
      void 0,
      {
        assertions: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'main.js'),
              moduleSideEffects: null
            }
          }
        },
        isEntry: true
      }
    ],
    ['dep.js', 'main.js', { assertions: {}, custom: {}, isEntry: false }],
    [
      'dep.js',
      'main.js',
      {
        assertions: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'dep.js'),
              moduleSideEffects: null
            }
          }
        },
        isEntry: false
      }
    ]
  ]);
});

test('passes on custom options', async (t) => {
  const resolveOptions = [];
  await rollup({
    input: 'entry/other.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        name: 'test',
        async buildStart() {
          await this.resolve('entry/main.js', void 0, { isEntry: false, custom: { test: 42 } });
        },
        resolveId(source, importer, options) {
          resolveOptions.push([
            getLastPathFragment(source),
            getLastPathFragment(importer),
            options
          ]);
        }
      }
    ]
  });
  t.deepEqual(resolveOptions, [
    ['main.js', void 0, { assertions: {}, custom: { test: 42 }, isEntry: false }],
    [
      'main.js',
      void 0,
      {
        assertions: {},
        custom: {
          test: 42,
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'main.js'),
              moduleSideEffects: null
            }
          }
        },
        isEntry: false
      }
    ],
    ['other.js', void 0, { assertions: {}, custom: {}, isEntry: true }],
    [
      'other.js',
      void 0,
      {
        assertions: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'other.js'),
              moduleSideEffects: null
            }
          }
        },
        isEntry: true
      }
    ]
  ]);
});

test('passes on meta information from other plugins', async (t) => {
  await rollup({
    input: 'entry/other.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        name: 'test-meta',
        resolveId(importee) {
          return {
            id: resolve(importee),
            meta: { test: { 'I am': 'here' } }
          };
        },

        load(id) {
          const info = this.getModuleInfo(id);
          t.deepEqual(info.meta, { test: { 'I am': 'here' } });
        }
      }
    ]
  });
});

test('allow other plugins to take over resolution', async (t) => {
  await rollup({
    input: 'entry/main.js',
    onwarn: failOnWarn(t),
    plugins: [
      nodeResolve(),
      {
        name: 'change-resolution',
        resolveId(importee) {
          // Only resolve if the id has been pre-resolved by node-resolve
          if (importee === join(DIRNAME, 'fixtures', 'entry', 'main.js')) {
            return {
              id: join(dirname(importee), 'other.js'),
              meta: { 'change-resolution': 'changed' }
            };
          }
          return null;
        },

        load(id) {
          const info = this.getModuleInfo(id);
          t.is(info.id, join(DIRNAME, 'fixtures', 'entry', 'other.js'));
          t.deepEqual(info.meta, { 'change-resolution': 'changed' });
        }
      }
    ]
  });
});
