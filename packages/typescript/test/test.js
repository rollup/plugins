const path = require('path');
const fs = require('fs');

const commonjs = require('@rollup/plugin-commonjs');
const test = require('ava');
const { rollup, watch } = require('rollup');
const ts = require('typescript');

const { evaluateBundle, getCode, onwarn } = require('../../../util/test');

const typescript = require('..');

test.beforeEach(() => process.chdir(__dirname));

const outputOptions = { format: 'esm' };

test.serial('runs code through typescript', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});

test.serial('ensures outDir is located in Rollup output dir', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        outDir: 'fixtures/basic/other/'
      })
    ],
    onwarn
  });

  const wrongDirError = await t.throwsAsync(() =>
    getCode(bundle, { format: 'esm', dir: 'fixtures/basic/dist' }, true)
  );
  t.true(
    wrongDirError.message.includes(
      `Path of Typescript compiler option 'outDir' must be located inside Rollup 'dir' option`
    ),
    `Unexpected error message: ${wrongDirError.message}`
  );
});

test.serial('ensures declarationDir is located in Rollup output dir', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        declarationDir: 'fixtures/basic/other/',
        declaration: true
      })
    ],
    onwarn
  });

  const wrongDirError = await t.throwsAsync(() =>
    getCode(bundle, { format: 'esm', dir: 'fixtures/basic/dist' }, true)
  );
  t.true(
    wrongDirError.message.includes(
      `Path of Typescript compiler option 'declarationDir' must be located inside Rollup 'dir' option`
    ),
    `Unexpected error message: ${wrongDirError.message}`
  );
});

test.serial('ensures multiple outputs can be built', async (t) => {
  // In a rollup.config.js we would pass an array
  // The rollup method that's exported as a library won't do that so we must make two calls
  const bundle1 = await rollup({
    input: 'fixtures/multiple-files/src/index.ts',
    plugins: [typescript({ tsconfig: 'fixtures/multiple-files/tsconfig.json' })]
  });

  const output1 = await getCode(
    bundle1,
    { file: 'fixtures/multiple-files/index.js', format: 'cjs' },
    true
  );

  const bundle2 = await rollup({
    input: 'fixtures/multiple-files/src/server.ts',
    plugins: [typescript({ tsconfig: 'fixtures/multiple-files/tsconfig.json' })]
  });

  const output2 = await getCode(
    bundle2,
    { file: 'fixtures/multiple-files/server.js', format: 'cjs' },
    true
  );

  t.deepEqual([...new Set(output1.concat(output2).map((out) => out.fileName))].sort(), [
    'index.d.ts',
    'index.js',
    'server.d.ts',
    'server.js'
  ]);
});

test.serial('relative paths in tsconfig.json are resolved relative to the file', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/relative-dir/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/relative-dir/tsconfig.json' })],
    onwarn
  });
  const output = await getCode(bundle, { format: 'esm', dir: 'fixtures/relative-dir/dist' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'main.d.ts']
  );

  t.true(output[1].source.includes('declare const answer = 42;'), output[1].source);
});

test.serial('throws for unsupported module types', async (t) => {
  const caughtError = await t.throws(() =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'AMD' })],
      onwarn
    })
  );

  t.true(
    caughtError.message.includes("The module kind should be 'ES2015' or 'ESNext, found: 'AMD'"),
    `Unexpected error message: ${caughtError.message}`
  );
});

test.serial('warns for invalid module types', async (t) => {
  const warnings = [];
  await t.throwsAsync(() =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'ES5' })],
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      message: `@rollup/plugin-typescript TS6046: Argument for '--module' option must be: 'none', 'commonjs', 'amd', 'system', 'umd', 'es6', 'es2015', 'es2020', 'esnext'.`
    }
  ]);
});

test.serial('ignores case of module types', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'eSnExT' })],
      onwarn
    })
  );
});

test.serial('handles async functions', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/async/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/async/tsconfig.json' })],
    onwarn
  });
  const wait = await evaluateBundle(bundle);
  await wait(3);
  t.pass();
});

test.serial('does not duplicate helpers', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dedup-helpers/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/dedup-helpers/tsconfig.json', target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  // The `__extends` function is defined in the bundle.
  t.true(code.includes('function __extends'), code);

  // No duplicate `__extends` helper is defined.
  t.false(code.includes('__extends$1'), code);
});

test.serial('transpiles `export class A` correctly', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-class-fix/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/export-class-fix/tsconfig.json' })],
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

test.serial('transpiles ES6 features to ES5 with source maps', async (t) => {
  process.chdir('fixtures/import-class');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);

  t.is(code.indexOf('...'), -1, code);
  t.is(code.indexOf('=>'), -1, code);
});

test.serial('reports diagnostics and throws if errors occur during transpilation', async (t) => {
  const caughtError = await t.throwsAsync(
    rollup({
      input: 'fixtures/syntax-error/missing-type.ts',
      plugins: [typescript({ tsconfig: 'fixtures/syntax-error/tsconfig.json' })],
      onwarn
    })
  );

  t.is(caughtError.message, '@rollup/plugin-typescript TS1110: Type expected.');
  t.is(caughtError.pluginCode, 'TS1110');
});

test.serial('ignore type errors if noEmitOnError is false', async (t) => {
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

  t.is(warnings.length, 2);

  t.is(warnings[0].code, 'PLUGIN_WARNING');
  t.is(warnings[0].plugin, 'typescript');
  t.is(warnings[0].pluginCode, 'TS1110');
  t.is(warnings[0].message, '@rollup/plugin-typescript TS1110: Type expected.');

  t.is(warnings[0].loc.line, 1);
  t.is(warnings[0].loc.column, 8);
  t.true(warnings[0].loc.file.includes('missing-type.ts'));
  t.true(warnings[0].frame.includes('var a: ;'));
});

test.serial('works with named exports for abstract classes', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-abstract-class/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/export-abstract-class/tsconfig.json' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);
  t.true(code.length > 0, code);
});

test.serial('should use named exports for classes', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-class/main.ts',
    plugins: [typescript({ include: 'fixtures/export-class/**/*' })],
    onwarn
  });
  t.is((await evaluateBundle(bundle)).foo, 'bar');
});

test.serial('supports overriding the TypeScript version', async (t) => {
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

          createWatchProgram(host) {
            const program = {
              emit(_, writeFile) {
                writeFile(
                  path.join(__dirname, 'fixtures/overriding-typescript/main.js'),
                  'export default 1337;'
                );
              }
            };
            host.afterProgramCreate(program);

            // Call the overrided emit function to trigger writeFile
            program.emit();

            return { close() {} };
          }
        })
      })
    ]
  });
  const result = await evaluateBundle(bundle);

  t.is(result, 1337);
});

test.serial('should not resolve .d.ts files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dts/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/dts/tsconfig.json' })],
    onwarn,
    external: ['an-import']
  });
  const imports = bundle.cache.modules[0].dependencies;
  t.deepEqual(imports, ['an-import']);
});

test.serial('should transpile JSX if enabled', async (t) => {
  process.chdir('fixtures/jsx');

  const bundle = await rollup({
    input: 'main.tsx',
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
    plugins: [typescript()],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  const usage = code.includes('React.createElement("span", __assign({}, props), "Yo!")');
  t.true(usage, 'should contain usage');
});

test.serial('complies code that uses browser functions', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/dom/main.ts',
    plugins: [typescript({ tsconfig: './fixtures/dom/tsconfig.json' })],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);

  t.true(code.includes('navigator.clipboard.readText()'), code);
});

test.serial('allows specifying a path for tsconfig.json', async (t) => {
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

test.serial('throws if tsconfig cannot be found', async (t) => {
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

test.serial('should throw on bad options', async (t) => {
  const warnings = [];
  await t.throwsAsync(
    () =>
      rollup({
        input: 'does-not-matter.ts',
        plugins: [typescript({ foo: 'bar' })],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onwarn({ toString, ...warning }) {
          // Can't match toString function, so omit it
          warnings.push(warning);
        }
      }),
    {
      message: "@rollup/plugin-typescript: Couldn't process compiler options"
    }
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

test.serial('should handle re-exporting types', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/reexport-type/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/reexport-type/tsconfig.json',
        // Make sure the transpiled files are empty
        inlineSourceMap: false,
        sourceMap: false
      })
    ],
    onwarn
  });
  await t.notThrowsAsync(getCode(bundle, outputOptions));
});

test.serial(
  'prevents errors due to conflicting `sourceMap`/`inlineSourceMap` options',
  async (t) => {
    await t.notThrowsAsync(
      rollup({
        input: 'fixtures/overriding-typescript/main.ts',
        plugins: [
          typescript({
            tsconfig: 'fixtures/overriding-typescript/tsconfig.json',
            inlineSourceMap: true
          })
        ],
        onwarn
      })
    );
  }
);

test.serial('should not emit null sourceContent', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'esm', sourcemap: true }, true);
  const sourcemap = output[0].map;
  // eslint-disable-next-line no-undefined
  t.false(sourcemap.sourcesContent.includes(undefined));
});

test.serial('should not fail if source maps are off', async (t) => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/overriding-typescript/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/overriding-typescript/tsconfig.json',
          inlineSourceMap: false,
          sourceMap: false
        })
      ],
      onwarn
    })
  );
});

test.serial('should allow a namespace containing a class', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-namespace-export-class/test.ts',
    plugins: [typescript({ tsconfig: 'fixtures/export-namespace-export-class/tsconfig.json' })],
    onwarn
  });
  const { MODE } = (await evaluateBundle(bundle)).MODE;
  const mode = new MODE();

  t.true(mode instanceof MODE);
});

test.serial('should allow merging an exported function and namespace', async (t) => {
  process.chdir('fixtures/export-fodule');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const f = (await evaluateBundle(bundle)).test;

  t.is(f(), 0);
  t.is(f.foo, '2');
});

test.serial('supports dynamic imports', async (t) => {
  const code = await getCode(
    await rollup({
      input: 'fixtures/dynamic-imports/main.ts',
      inlineDynamicImports: true,
      plugins: [typescript({ tsconfig: 'fixtures/dynamic-imports/tsconfig.json' })],
      onwarn
    }),
    outputOptions
  );
  t.true(code.includes("console.log('dynamic')"));
});

test.serial('supports CommonJS imports when the output format is CommonJS', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/commonjs-imports/main.ts',
    plugins: [
      typescript({ tsconfig: 'fixtures/commonjs-imports/tsconfig.json', module: 'CommonJS' }),
      commonjs({ extensions: ['.ts', '.js'] })
    ],
    onwarn
  });
  const output = await evaluateBundle(bundle);
  t.is(output, 'exported from commonjs');
});

test.serial('supports optional chaining', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/optional-chaining/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/optional-chaining/tsconfig.json',
        module: 'esnext',
        target: 'es2020'
      })
    ],
    onwarn
  });
  t.regex(await getCode(bundle), /.*var main = o\.b\?\.c \?\? 'NOT FOUND';.*/);
});

test.serial('supports incremental build', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        incremental: true
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'esm', dir: 'fixtures/basic' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'tsconfig.tsbuildinfo']
  );
});

test.serial('supports incremental rebuild', async (t) => {
  process.chdir('fixtures/incremental');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const output = await getCode(bundle, { format: 'esm', dir: 'dist' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );
});

test.serial('supports consecutive incremental rebuilds', async (t) => {
  process.chdir('fixtures/incremental');

  const firstBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });

  const firstRun = await getCode(firstBundle, { format: 'esm', dir: 'dist' }, true);
  t.deepEqual(
    firstRun.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );

  const secondBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const secondRun = await getCode(secondBundle, { format: 'esm', dir: 'dist' }, true);
  t.deepEqual(
    secondRun.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );
});

// https://github.com/rollup/plugins/issues/681
test.serial('supports incremental rebuilds with no change to cache', async (t) => {
  process.chdir('fixtures/incremental-output-cache');
  const cleanup = () => {
    let files;
    try {
      files = fs.readdirSync('dist');
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    files.forEach((file) => fs.unlinkSync(path.join('dist', file)));
  };

  cleanup();

  const firstBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });

  const firstRun = await getCode(firstBundle, { format: 'esm', dir: 'dist' }, true);
  t.deepEqual(
    firstRun.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );
  await firstBundle.write({ dir: 'dist' });

  const secondBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const secondRun = await getCode(secondBundle, { format: 'esm', dir: 'dist' }, true);
  t.deepEqual(
    secondRun.map((out) => out.fileName),
    // .tsbuildinfo should not be emitted
    ['main.js']
  );

  cleanup();
});

test.serial.skip('supports project references', async (t) => {
  process.chdir('fixtures/project-references');

  const bundle = await rollup({
    input: 'zoo/zoo.ts',
    plugins: [typescript({ tsconfig: 'zoo/tsconfig.json' })],
    onwarn
  });
  const createZoo = await evaluateBundle(bundle);
  const zoo = createZoo();

  t.is(zoo.length, 1);
  t.is(zoo[0].size, 'medium');
  t.is(zoo[0].name, 'Bob!?! ');
});

test.serial('warns if sourceMap is set in Typescript but not Rollup', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', sourceMap: true })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'esm' });

  t.is(warnings.length, 1);
  t.true(
    warnings[0].message.includes(`Rollup 'sourcemap' option must be set to generate source maps`),
    warnings[0].message
  );
});

test.serial('warns if sourceMap is set in Rollup but not Typescript', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', sourceMap: false })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'esm', sourcemap: true });

  t.is(warnings.length, 1);
  t.true(
    warnings[0].message.includes(
      `Typescript 'sourceMap' compiler option must be set to generate source maps`
    ),
    warnings[0].message
  );
});

test.serial('normalizes resolved ids to avoid duplicate output on windows', async (t) => {
  const bundle = await rollup({
    input: ['fixtures/normalize-ids/one.js', 'fixtures/normalize-ids/two.js'],
    plugins: [
      typescript({
        include: ['*.js', '**/*.js'],
        tsconfig: 'fixtures/normalize-ids/tsconfig.json'
      })
    ]
  });

  const files = await getCode(bundle, { format: 'esm' }, true);

  t.is(files.length, 2);
  t.true(files[1].fileName.includes('two.js'), files[1].fileName);
  t.true(files[1].code.includes("import { one } from './one.js';"), files[1].code);
});

test.serial('does not warn if sourceMap is set in Rollup and unset in Typescript', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json' })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'esm', sourcemap: true });

  t.is(warnings.length, 0);
});

test('supports custom transformers', async (t) => {
  const warnings = [];

  let program = null;
  let typeChecker = null;

  const bundle = await rollup({
    input: 'fixtures/transformers/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/transformers/tsconfig.json',
        outDir: 'fixtures/transformers/dist',
        declaration: true,
        transformers: {
          before: [
            // Replace the source contents before transforming
            {
              type: 'program',
              factory: (p) => {
                program = p;

                return function removeOneParameterFactory(context) {
                  return function removeOneParameter(source) {
                    function visitor(node) {
                      if (ts.isArrowFunction(node)) {
                        return ts.createArrowFunction(
                          node.modifiers,
                          node.typeParameters,
                          [node.parameters[0]],
                          node.type,
                          node.equalsGreaterThanToken,
                          node.body
                        );
                      }

                      return ts.visitEachChild(node, visitor, context);
                    }

                    return ts.visitEachChild(source, visitor, context);
                  };
                };
              }
            }
          ],
          after: [
            // Enforce a constant numeric output
            {
              type: 'typeChecker',
              factory: (tc) => {
                typeChecker = tc;

                return function enforceConstantReturnFactory(context) {
                  return function enforceConstantReturn(source) {
                    function visitor(node) {
                      if (ts.isReturnStatement(node)) {
                        return ts.createReturn(ts.createNumericLiteral('1'));
                      }

                      return ts.visitEachChild(node, visitor, context);
                    }

                    return ts.visitEachChild(source, visitor, context);
                  };
                };
              }
            }
          ],
          afterDeclarations: [
            // Change the return type to numeric
            function fixDeclarationFactory(context) {
              return function fixDeclaration(source) {
                function visitor(node) {
                  if (ts.isFunctionTypeNode(node)) {
                    return ts.createFunctionTypeNode(
                      node.typeParameters,
                      [node.parameters[0]],
                      ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
                    );
                  }

                  return ts.visitEachChild(node, visitor, context);
                }

                return ts.visitEachChild(source, visitor, context);
              };
            }
          ]
        }
      })
    ],
    onwarn(warning) {
      warnings.push(warning);
    }
  });

  const output = await getCode(bundle, { format: 'esm', dir: 'fixtures/transformers' }, true);

  t.is(warnings.length, 0);
  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'dist/main.d.ts']
  );

  // Expect the function to have one less arguments from before transformer and return 1 from after transformer
  t.true(output[0].code.includes('var HashFn = function (val) { return 1; };'), output[0].code);

  // Expect the definition file to reflect the resulting function type after transformer modifications
  t.true(
    output[1].source.includes('export declare const HashFn: (val: string) => number;'),
    output[1].source
  );

  // Expect a Program to have been forwarded for transformers with custom factories requesting one
  t.deepEqual(program && program.emit && typeof program.emit === 'function', true);

  // Expect a TypeChecker to have been forwarded for transformers with custom factories requesting one
  t.deepEqual(
    typeChecker &&
      typeChecker.getTypeAtLocation &&
      typeof typeChecker.getTypeAtLocation === 'function',
    true
  );
});

function fakeTypescript(custom) {
  return {
    sys: ts.sys,
    createModuleResolutionCache: ts.createModuleResolutionCache,
    ModuleKind: ts.ModuleKind,

    transpileModule() {
      return {
        outputText: '',
        diagnostics: [],
        sourceMapText: JSON.stringify({ mappings: '' })
      };
    },

    createWatchCompilerHost() {
      return {
        afterProgramCreate() {}
      };
    },

    createWatchProgram() {
      return {};
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
    },

    getOutputFileNames(_, id) {
      return [id.replace(/\.tsx?/, '.js')];
    },

    // eslint-disable-next-line no-undefined
    getTsBuildInfoEmitOutputFilePath: () => undefined,
    ...custom
  };
}

test.serial('picks up on newly included typescript files in watch mode', async (t) => {
  const dirName = path.join('fixtures', 'watch');

  // clean up artefacts from earlier builds
  const fileNames = fs.readdirSync(dirName);
  fileNames.forEach((fileName) => {
    if (path.extname(fileName) === '.ts') {
      fs.unlinkSync(path.join(dirName, fileName));
    }
  });

  // set up initial main.ts
  // (file will be modified later in the test)
  fs.copyFileSync(path.join(dirName, 'main.ts.1'), path.join(dirName, 'main.ts'));

  const watcher = watch({
    input: 'fixtures/watch/main.ts',
    output: {
      dir: 'fixtures/watch/dist'
    },
    plugins: [
      typescript({
        tsconfig: 'fixtures/watch/tsconfig.json',
        target: 'es5'
      })
    ],
    onwarn
  });

  await waitForWatcherEvent(watcher, 'END');

  // add new .ts file
  fs.copyFileSync(path.join(dirName, 'new.ts.1'), path.join(dirName, 'new.ts'));

  // update main.ts file to include new.ts
  const newMain = fs.readFileSync(path.join(dirName, 'main.ts.2'));
  fs.writeFileSync(path.join(dirName, 'main.ts'), newMain);

  await waitForWatcherEvent(watcher, 'END');

  watcher.close();

  const code = fs.readFileSync(path.join(dirName, 'dist', 'main.js'));
  const usage = code.includes('Is it me');
  t.true(usage, 'should contain usage');
});

test.serial('works when code is in src directory', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/src-dir/src/index.ts',
    output: [
      {
        dir: 'fixtures/src-dir/dist',
        format: 'esm'
      }
    ],
    plugins: [
      typescript({
        tsconfig: 'fixtures/src-dir/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'esm', dir: 'fixtures/src-dir/dist' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['index.js', 'index.d.ts']
  );
});

function waitForWatcherEvent(watcher, eventCode) {
  return new Promise((resolve, reject) => {
    watcher.on('event', function handleEvent(event) {
      if (event.code === eventCode) {
        watcher.off('event', handleEvent);
        resolve(event);
      } else if (event.code === 'ERROR') {
        watcher.off('event', handleEvent);
        reject(event);
      }
    });
  });
}
