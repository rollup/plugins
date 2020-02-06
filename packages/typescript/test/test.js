const path = require('path');

const commonjs = require('@rollup/plugin-commonjs');
const test = require('ava');
const { rollup } = require('rollup');
const ts = require('typescript');

const { getCode, testBundle } = require('../../../util/test');

const typescript = require('..');

test.beforeEach(() => process.chdir(__dirname));

const outputOptions = { format: 'esm' };

async function evaluateBundle(bundle) {
  const { module } = await testBundle(null, bundle);
  return module.exports;
}

function onwarn(warning) {
  // eslint-disable-next-line no-console
  console.warn(warning.toString());
}

test('runs code through typescript', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});

test('ignores the declaration option', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ declaration: true })],
      onwarn
    })
  );
});

test('throws for unsupported module types', async (t) => {
  const caughtError = await t.throws(() =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ module: 'AMD' })],
      onwarn
    })
  );

  t.true(
    caughtError.message.includes("The module kind should be 'ES2015' or 'ESNext, found: 'AMD'"),
    `Unexpected error message: ${caughtError.message}`
  );
});

test('warns for invalid module types', async (t) => {
  const warnings = [];
  await t.throwsAsync(() =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ module: 'ES5' })],
      onwarn({ toString, ...warning }) {
        warnings.push(warning);
      }
    })
  );

  t.deepEqual(warnings, [
    {
      code: 'PLUGIN_WARNING',
      plugin: 'typescript',
      pluginCode: 'TS6046',
      message: `@rollup/plugin-typescript TS6046: Argument for '--module' option must be: 'none', 'commonjs', 'amd', 'system', 'umd', 'es6', 'es2015', 'esnext'.`
    }
  ]);
});

test('ignores case of module types', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ module: 'eSnExT' })],
      onwarn
    })
  );
});

test('handles async functions', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/async/main.ts',
    plugins: [typescript()],
    onwarn
  });
  const wait = await evaluateBundle(bundle);
  await wait(3);
  t.pass();
});

test('does not duplicate helpers', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dedup-helpers/main.ts',
    plugins: [typescript({ target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  // The `__extends` function is defined in the bundle.
  t.true(code.includes('function __extends'), code);

  // No duplicate `__extends` helper is defined.
  t.false(code.includes('__extends$1'), code);
});

test('transpiles `export class A` correctly', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-class-fix/main.ts',
    plugins: [typescript()],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);
  t.true(code.includes('export { A, B };'), code);

  const { A, B } = await evaluateBundle(bundle);
  const aInst = new A();
  const bInst = new B();
  t.true(aInst instanceof A);
  t.true(bInst instanceof B);
});

test('transpiles ES6 features to ES5 with source maps', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/import-class/main.ts',
    plugins: [typescript()],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);

  t.is(code.indexOf('...'), -1, code);
  t.is(code.indexOf('=>'), -1, code);
});

test('reports diagnostics and throws if errors occur during transpilation', async (t) => {
  const caughtError = await t.throwsAsync(
    rollup({
      input: 'fixtures/syntax-error/missing-type.ts',
      plugins: [typescript()],
      onwarn
    })
  );

  t.is(caughtError.message, '@rollup/plugin-typescript TS1110: Type expected.');
  t.is(caughtError.pluginCode, 'TS1110');
});

test('ignore type errors if noEmitOnError is false', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/syntax-error/missing-type.ts',
    plugins: [typescript({ noEmitOnError: false })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  const code = await getCode(bundle, outputOptions);

  t.true(code.includes(`console.log('hello world')`));

  t.is(warnings.length, 1);

  t.is(warnings[0].code, 'PLUGIN_WARNING');
  t.is(warnings[0].plugin, 'typescript');
  t.is(warnings[0].pluginCode, 'TS1110');
  t.is(warnings[0].message, '@rollup/plugin-typescript TS1110: Type expected.');

  t.is(warnings[0].loc.line, 1);
  t.is(warnings[0].loc.column, 8);
  t.true(warnings[0].loc.file.includes('missing-type.ts'));
  t.true(warnings[0].frame.includes('var a: ;'));
});

test('works with named exports for abstract classes', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-abstract-class/main.ts',
    plugins: [typescript()],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);
  t.true(code.length > 0, code);
});

test('should use named exports for classes', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-class/main.ts',
    plugins: [typescript()],
    onwarn
  });
  t.is((await evaluateBundle(bundle)).foo, 'bar');
});

test('supports overriding the TypeScript version', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/overriding-typescript/main.ts',
    onwarn,
    plugins: [
      typescript({
        // Don't use `tsconfig.json`
        tsconfig: false,

        // test with a mocked version of TypeScript
        typescript: fakeTypescript({
          version: '1.8.0-fake',

          createLanguageService() {
            return {
              getProgram: () => null,
              getSyntacticDiagnostics: () => [],
              getSemanticDiagnostics: () => [],
              getEmitOutput() {
                // Ignore the code to transpile. Always return the same thing.
                return {
                  outputFiles: [
                    {
                      name: 'whatever.js',
                      text: 'export default 1337;'
                    }
                  ],
                  emitSkipped: false
                };
              }
            };
          }
        })
      })
    ]
  });
  const result = await evaluateBundle(bundle);

  t.is(result, 1337);
});

test('supports overriding tslib with a string', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/overriding-tslib/main.ts',
    plugins: [
      typescript({ tslib: 'export const __extends = (Main, Super) => Main.myParent = Super' })
    ],
    onwarn
  });
  const code = await evaluateBundle(bundle);

  t.is(code.myParent.baseMethod(), 'base method');
});

test('supports overriding tslib with a promise', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/overriding-tslib/main.ts',
    plugins: [
      typescript({
        tslib: Promise.resolve('export const __extends = (Main, Super) => Main.myParent = Super')
      })
    ],
    onwarn
  });
  const code = await evaluateBundle(bundle);

  t.is(code.myParent.baseMethod(), 'base method');
});

test('should not resolve .d.ts files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dts/main.ts',
    plugins: [typescript()],
    onwarn,
    external: ['an-import']
  });
  const imports = bundle.cache.modules[0].dependencies;
  t.deepEqual(imports, ['an-import']);
});

test('should transpile JSX if enabled', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/jsx/main.tsx',
    plugins: [typescript({ jsx: 'react' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.not(code.indexOf('var __assign = '), -1, 'should contain __assign definition');

  const usage = code.indexOf('React.createElement("span", __assign({}, props), "Yo!")');

  t.not(usage, -1, 'should contain usage');
});

test.serial('automatically loads tsconfig.json from the current directory', async (t) => {
  process.chdir('fixtures/tsconfig-jsx');

  const bundle = await rollup({
    input: 'main.tsx',
    plugins: [typescript()],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.indexOf('React.createElement("span", __assign({}, props), "Yo!")');
  t.not(usage, -1, 'should contain usage');
});

test.serial('should support extends property in tsconfig', async (t) => {
  process.chdir('fixtures/tsconfig-extends');

  const bundle = await rollup({
    input: 'main.tsx',
    plugins: [typescript()],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.indexOf('React.createElement("span", __assign({}, props), "Yo!")');
  t.not(usage, -1, 'should contain usage');
});

test.serial('should support extends property with given tsconfig', async (t) => {
  process.chdir('fixtures/tsconfig-extends/ts-config-extends-child');

  const bundle = await rollup({
    input: 'main.tsx',
    plugins: [
      typescript({
        tsconfig: './tsconfig.json'
      })
    ],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.indexOf('React.createElement("span", __assign({}, props), "Yo!")');
  t.not(usage, -1, 'should contain usage');
});

test.serial('should support extends property with node resolution', async (t) => {
  process.chdir('fixtures/tsconfig-extends-module');

  const bundle = await rollup({
    input: 'main.tsx',
    plugins: [
      typescript()
    ],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.includes('React.createElement("span", __assign({}, props), "Yo!")');
  t.true(usage, 'should contain usage');
});

test('complies code that uses browser functions', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dom/main.ts',
    plugins: [typescript({ tsconfig: './fixtures/dom/tsconfig.json' })],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);

  t.true(code.includes('navigator.clipboard.readText()'), code);
});

test('allows specifying a path for tsconfig.json', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/tsconfig-jsx/main.tsx',
    plugins: [
      typescript({ tsconfig: path.resolve(__dirname, 'fixtures/tsconfig-jsx/tsconfig.json') })
    ],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.indexOf('React.createElement("span", __assign({}, props), "Yo!")');
  t.not(usage, -1, 'should contain usage');
});

test('throws if tsconfig cannot be found', async (t) => {
  const caughtError = await t.throws(() =>
    rollup({
      input: 'fixtures/tsconfig-jsx/main.tsx',
      plugins: [typescript({ tsconfig: path.resolve(__dirname, 'does-not-exist.json') })],
      onwarn
    })
  );

  t.true(
    caughtError.message.includes('Could not find specified tsconfig.json'),
    `Unexpected error message: ${caughtError.message}`
  );
});

test('should throw on bad options', async (t) => {
  const warnings = [];
  await t.throwsAsync(
    () =>
      rollup({
        input: 'does-not-matter.ts',
        plugins: [typescript({ foo: 'bar' })],
        onwarn({ toString, ...warning }) {
          // Can't match toString function, so omit it
          warnings.push(warning);
        }
      }),
    "@rollup/plugin-typescript: Couldn't process compiler options"
  );

  t.deepEqual(warnings, [
    {
      code: 'PLUGIN_WARNING',
      plugin: 'typescript',
      pluginCode: 'TS5023',
      message: `@rollup/plugin-typescript TS5023: Unknown compiler option 'foo'.`
    }
  ]);
});

test('should handle re-exporting types', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/reexport-type/main.ts',
    plugins: [typescript()],
    onwarn
  });
  await t.notThrowsAsync(getCode(bundle, outputOptions));
});

test('prevents errors due to conflicting `sourceMap`/`inlineSourceMap` options', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/overriding-typescript/main.ts',
      plugins: [typescript({ inlineSourceMap: true })],
      onwarn
    })
  );
});

test('should not fail if source maps are off', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/overriding-typescript/main.ts',
      plugins: [
        typescript({
          inlineSourceMap: false,
          sourceMap: false
        })
      ],
      onwarn
    })
  );
});

test('does not include helpers in source maps', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dedup-helpers/main.ts',
    plugins: [typescript({ sourceMap: true })],
    onwarn
  });
  const { output } = await bundle.generate({
    format: 'es',
    sourcemap: true
  });
  const [{ map }] = output;

  t.true(map.sources.every((source) => !source.includes('tslib')));
});

test('should allow a namespace containing a class', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-namespace-export-class/test.ts',
    plugins: [typescript()],
    onwarn
  });
  const { MODE } = (await evaluateBundle(bundle)).MODE;
  const mode = new MODE();

  t.true(mode instanceof MODE);
});

test('should allow merging an exported function and namespace', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-fodule/main.ts',
    plugins: [typescript()],
    onwarn
  });
  const f = (await evaluateBundle(bundle)).test;

  t.is(f(), 0);
  t.is(f.foo, '2');
});

test('supports dynamic imports', async (t) => {
  const code = await getCode(
    await rollup({
      input: 'fixtures/dynamic-imports/main.ts',
      inlineDynamicImports: true,
      plugins: [typescript()],
      onwarn
    }),
    outputOptions
  );
  t.true(code.includes("console.log('dynamic')"));
});

test('supports CommonJS imports when the output format is CommonJS', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/commonjs-imports/main.ts',
    plugins: [typescript({ module: 'CommonJS' }), commonjs({ extensions: ['.ts', '.js'] })],
    onwarn
  });
  const output = await evaluateBundle(bundle);
  t.is(output, 'exported from commonjs');
});

function fakeTypescript(custom) {
  return Object.assign(
    {
      sys: ts.sys,
      createModuleResolutionCache: ts.createModuleResolutionCache,
      createDocumentRegistry: ts.createDocumentRegistry,
      ModuleKind: ts.ModuleKind,
      ScriptSnapshot: ts.ScriptSnapshot,

      transpileModule() {
        return {
          outputText: '',
          diagnostics: [],
          sourceMapText: JSON.stringify({ mappings: '' })
        };
      },

      convertCompilerOptionsFromJson(options) {
        ['include', 'exclude', 'typescript', 'tslib', 'tsconfig'].forEach((option) => {
          if (option in options) {
            throw new Error(`unrecognized compiler option "${option}"`);
          }
        });

        return {
          options,
          errors: []
        };
      },

      parseJsonConfigFileContent(json, host, basePath, existingOptions) {
        return {
          options: {
            ...json.compilerOptions,
            ...existingOptions
          },
          fileNames: [],
          errors: []
        };
      }
    },
    custom
  );
}
