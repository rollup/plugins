import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { rollup } from 'rollup';
import { nodeResolve, DEFAULTS } from 'current-package';
import { evaluateBundle, getCode, getImports, testBundle } from '../../../util/test.js';

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));
process.chdir(join(DIRNAME, 'fixtures'));
const avaAssertions = {
  is(actual, expected, message) {
    expect(actual, message).toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, message).toEqual(expected);
  }
};
const failOnWarn = (warning) =>
  expect.unreachable(`No warnings were expected, got:\n${warning.code}\n${warning.message}`);
const getLastPathFragment = (path) => path && path.split(/[\\/]/).slice(-1)[0];
test('exposes plugin version', () => {
  const plugin = nodeResolve();
  expect(plugin.version).toMatch(/^\d+\.\d+\.\d+/);
});
test('has default config', () => {
  expect(DEFAULTS).toMatchSnapshot();
});
test('finds a module with jsnext:main', async () => {
  const bundle = await rollup({
    input: 'jsnext.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        mainFields: ['jsnext:main', 'module', 'main']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('JSNEXT');
});
test('finds and converts a basic CommonJS module', async () => {
  const bundle = await rollup({
    input: 'commonjs.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        mainFields: ['main']
      }),
      commonjs()
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('handles cyclic CommonJS modules', async () => {
  const bundle = await rollup({
    input: 'cyclic-commonjs/main.js',
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        expect.unreachable(`Unexpected warning:\n${warning.code}\n${warning.message}`);
      }
    },
    plugins: [nodeResolve(), commonjs()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.main).toBe('main');
});
test('handles a trailing slash', async () => {
  const bundle = await rollup({
    input: 'trailing-slash.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        mainFields: ['main']
      }),
      commonjs()
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('finds a file inside a package directory', async () => {
  const bundle = await rollup({
    input: 'granular.js',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('FOO');
});
test('loads local directories by finding index.js within them', async () => {
  const bundle = await rollup({
    input: 'local-index/main.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe(42);
});
test('loads package directories by finding index.js within them', async () => {
  const bundle = await rollup({
    input: 'package-index.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  });
  const code = await getCode(bundle);
  expect(code.indexOf('setPrototypeOf')).toBeTruthy();
});
test('supports non-standard extensions', async () => {
  const bundle = await rollup({
    input: 'extensions/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.wut']
      })
    ]
  });
  await testBundle(avaAssertions, bundle);
});
test('does not fallback to standard node resolve algorithm if error with exports one', async () => {
  try {
    await rollup({
      input: 'exports-error-no-fallback/main.js',
      onwarn: failOnWarn,
      plugins: [
        nodeResolve({
          extensions: ['.js']
        })
      ]
    });
    expect.unreachable('expecting throw');
  } catch {
    expect(true).toBe(true);
  }
});
test('supports JS extensions in TS when referring to TS imports', async () => {
  const bundle = await rollup({
    input: 'ts-import-js-extension/import-ts-with-js-extension.ts',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('supports JS extensions in TS when referring to TSX imports', async () => {
  const bundle = await rollup({
    input: 'tsx-import-js-extension/import-tsx-with-js-extension.ts',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts', '.tsx']
      }),
      babel({
        babelHelpers: 'bundled',
        plugins: ['@babel/plugin-transform-typescript'],
        extensions: ['.js', '.ts', '.tsx']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('supports JSX extensions in TS when referring to TSX imports', async () => {
  const bundle = await rollup({
    input: 'tsx-import-jsx-extension/import-tsx-with-jsx-extension.ts',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.ts', '.tsx']
      }),
      babel({
        babelHelpers: 'bundled',
        plugins: ['@babel/plugin-transform-typescript'],
        extensions: ['.js', '.ts', '.tsx']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('supports MJS extensions in TS when referring to MTS imports', async () => {
  const bundle = await rollup({
    input: 'ts-import-mjs-extension/import-ts-with-mjs-extension.ts',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('supports CJS extensions in TS when referring to CTS imports', async () => {
  const bundle = await rollup({
    input: 'ts-import-cjs-extension/import-ts-with-cjs-extension.ts',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('supports JS extensions in TS actually importing JS with export map', async () => {
  const bundle = await rollup({
    input: 'ts-import-js-extension-for-js-file-export-map/import-js-with-js-extension.ts',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('handles package.json being a directory earlier in the path', async () => {
  const bundle = await rollup({
    input: 'package-json-in-path/package.json/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        extensions: ['.js']
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('It works!');
});
test('ignores IDs with null character', async () => {
  const result = await nodeResolve().resolveId.handler('\0someid', 'test.js', {});
  expect(result).toBe(null);
});
test('finds and uses an .mjs module', async () => {
  const bundle = await rollup({
    input: 'module-mjs.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        preferBuiltins: false
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MODULE-MJS');
});
test('supports ./ in entry filename', async () => {
  const bundle = await rollup({
    input: './jsnext.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve({})]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('MAIN');
});
test('throws error if local id is not resolved', async () => {
  expect.assertions(1);
  try {
    await rollup({
      input: 'unresolved-local.js',
      onwarn: failOnWarn,
      plugins: [nodeResolve()]
    });
  } catch (e) {
    expect(e.message).toMatchSnapshot();
  }
});
test('allows custom moduleDirectories', async () => {
  const bundle = await rollup({
    input: 'custom-module-dir/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        moduleDirectories: ['js_modules']
      })
    ]
  });
  expect(bundle.cache.modules[0].id).toBe(resolve('custom-module-dir/js_modules/foo.js'));
});
test('allows custom moduleDirectories with legacy customResolveOptions.moduleDirectory', async () => {
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
  expect(bundle.cache.modules[0].id).toBe(resolve('custom-module-dir/js_modules/foo.js'));
  expect(warnings.length).toBe(1);
  expect(warnings).toMatchSnapshot();
});
test('moduleDirectories option rejects paths that contain a slash', async () => {
  expect(() =>
    nodeResolve({
      moduleDirectories: ['some/path']
    })
  ).toThrow(/must only contain directory names/);
});
test('allows custom modulePaths', async () => {
  const bundle = await rollup({
    input: 'custom-module-path/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        modulePaths: [join(process.cwd(), 'custom-module-path/node_modules')]
      })
    ]
  });
  const { dependency } = await evaluateBundle(bundle);
  expect(dependency).toBe('DEPENDENCY');
});
test('ignores deep-import non-modules', async () => {
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
  expect(imports).toEqual(['foo/deep']);
  expect(warnings.length, 'number of warnings').toBe(1);
  const [{ exporter, id }] = warnings;
  expect(exporter, 'exporter').toBe('foo/deep');
  expect(id.endsWith('deep-import-non-module.js'), 'id').toBe(true);
});
test('generates manual chunks', async () => {
  const chunkName = 'mychunk';
  const bundle = await rollup({
    input: 'manualchunks.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  });
  const { output } = await bundle.generate({
    format: 'es',
    chunkFileNames: '[name]',
    manualChunks: {
      [chunkName]: ['simple']
    }
  });
  expect(output.find(({ fileName }) => fileName === chunkName)).toBeTruthy();
});
test('resolves dynamic imports', async () => {
  const bundle = await rollup({
    input: 'dynamic.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle, {
    options: {
      inlineDynamicImports: true
    }
  });
  const result = await module.exports;
  expect(result.default).toBe(42);
});
test('can resolve imports with hash in path', async () => {
  const bundle = await rollup({
    input: 'hash-in-path.js',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('resolved with hash');
});
test('can resolve imports with search params', async () => {
  const bundle = await rollup({
    input: 'search-params.js',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('resolved with search params');
});
test('can resolve imports with search params and hash', async () => {
  const bundle = await rollup({
    input: 'search-params-and-hash.js',
    onwarn: failOnWarn,
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
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports).toBe('resolved with search params and hash');
});
test('marks a module as external if the resolved version is external', async () => {
  const bundle = await rollup({
    input: 'resolved-external/main.js',
    onwarn: failOnWarn,
    external: [/node_modules/],
    plugins: [nodeResolve()]
  });
  const code = await getCode(bundle);
  expect(/node_modules/.test(code)).toBe(false);
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
  test(`throws error for removed customResolveOptions.${resolveOption} option`, () => {
    try {
      nodeResolve({
        customResolveOptions: {
          [resolveOption]: 'something'
        }
      });
    } catch (e) {
      expect(e).toMatchSnapshot();
      return;
    }
    expect.unreachable('expecting error');
  });
});
test('passes on "isEntry" flag and original importee', async () => {
  const resolveOptions = [];
  await rollup({
    input: 'entry/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve(),
      {
        name: 'test',
        buildStart() {
          // A emitted chunk with an importer must not lose its "isEntry" flag after node-resolve
          this.emitFile({
            type: 'chunk',
            importer: 'entry/main.js',
            id: './other.js'
          });
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
  expect(resolveOptions).toEqual([
    [
      'other.js',
      'main.js',
      {
        attributes: {},
        custom: {},
        isEntry: true
      }
    ],
    [
      'main.js',
      void 0,
      {
        attributes: {},
        custom: {},
        isEntry: true
      }
    ],
    [
      'other.js',
      'main.js',
      {
        attributes: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'other.js'),
              moduleSideEffects: null
            },
            importee: './other.js'
          }
        },
        isEntry: true
      }
    ],
    [
      'main.js',
      void 0,
      {
        attributes: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'main.js'),
              moduleSideEffects: null
            },
            importee: 'entry/main.js'
          }
        },
        isEntry: true
      }
    ],
    [
      'dep.js',
      'main.js',
      {
        attributes: {},
        custom: {},
        isEntry: false
      }
    ],
    [
      'dep.js',
      'main.js',
      {
        attributes: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'dep.js'),
              moduleSideEffects: null
            },
            importee: './dep.js'
          }
        },
        isEntry: false
      }
    ]
  ]);
});
test('passes on custom options', async () => {
  const resolveOptions = [];
  await rollup({
    input: 'entry/other.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve(),
      {
        name: 'test',
        async buildStart() {
          await this.resolve('entry/main.js', void 0, {
            isEntry: false,
            skipSelf: false,
            custom: {
              test: 42
            }
          });
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
  expect(resolveOptions).toEqual([
    [
      'main.js',
      void 0,
      {
        attributes: {},
        custom: {
          test: 42
        },
        isEntry: false
      }
    ],
    [
      'main.js',
      void 0,
      {
        attributes: {},
        custom: {
          test: 42,
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'main.js'),
              moduleSideEffects: null
            },
            importee: 'entry/main.js'
          }
        },
        isEntry: false
      }
    ],
    [
      'other.js',
      void 0,
      {
        attributes: {},
        custom: {},
        isEntry: true
      }
    ],
    [
      'other.js',
      void 0,
      {
        attributes: {},
        custom: {
          'node-resolve': {
            resolved: {
              id: join(DIRNAME, 'fixtures', 'entry', 'other.js'),
              moduleSideEffects: null
            },
            importee: 'entry/other.js'
          }
        },
        isEntry: true
      }
    ]
  ]);
});
test('passes on meta information from other plugins', async () => {
  await rollup({
    input: 'entry/other.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve(),
      {
        name: 'test-meta',
        resolveId(importee) {
          return {
            id: resolve(importee),
            meta: {
              test: {
                'I am': 'here'
              }
            }
          };
        },
        load(id) {
          const info = this.getModuleInfo(id);
          expect(info.meta).toEqual({
            test: {
              'I am': 'here'
            }
          });
        }
      }
    ]
  });
});
test('allow other plugins to take over resolution', async () => {
  await rollup({
    input: 'entry/main.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve(),
      {
        name: 'change-resolution',
        resolveId(importee) {
          // Only resolve if the id has been pre-resolved by node-resolve
          if (importee === join(DIRNAME, 'fixtures', 'entry', 'main.js')) {
            return {
              id: join(dirname(importee), 'other.js'),
              meta: {
                'change-resolution': 'changed'
              }
            };
          }
          return null;
        },
        load(id) {
          const info = this.getModuleInfo(id);
          expect(info.id).toBe(join(DIRNAME, 'fixtures', 'entry', 'other.js'));
          expect(info.meta).toEqual({
            'change-resolution': 'changed'
          });
        }
      }
    ]
  });
});
test('error message for invalid entry', async () => {
  const error = await rollup({
    input: '',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  }).catch((caught) => caught);
  expect(error.message).toBe(`Could not resolve entry module "".`);
});
