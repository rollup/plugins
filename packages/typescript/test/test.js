const path = require('path');
const fs = require('fs');

const commonjs = require('@rollup/plugin-commonjs');
const { rollup, watch } = require('rollup');
const ts = require('typescript');

const { evaluateBundle, getCode, getFiles, onwarn } = require('../../../util/test');

const typescript = require('..');

const {
  createAvaAssertions,
  fakeTypescript,
  forceRemove,
  waitForWatcherEvent
} = require('./helpers');

const t = createAvaAssertions();

beforeEach(() => process.chdir(__dirname));

const outputOptions = { format: 'es' };

test.sequential('runs code through typescript', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});

test.sequential('allows nodenext module', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'nodenext' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.false(code.includes('number'), code);
  t.true(code.includes('const'), code);
});

test.sequential('runs code through typescript with compilerOptions', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({ tsconfig: 'fixtures/basic/tsconfig.json', compilerOptions: { target: 'es5' } })
    ],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});

test.sequential('ensures outDir is located in Rollup output dir', async () => {
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
    getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true)
  );
  t.true(
    wrongDirError.message.includes(
      `Path of Typescript compiler option 'outDir' must be located inside Rollup 'dir' option`
    ),
    `Unexpected error message: ${wrongDirError.message}`
  );
});

test.sequential('ensures declarationDir is located in Rollup output dir', async () => {
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
    getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true)
  );
  t.true(
    wrongDirError.message.includes(
      `Path of Typescript compiler option 'declarationDir' must be located inside Rollup 'dir' option`
    ),
    `Unexpected error message: ${wrongDirError.message}`
  );
});

test.sequential(
  'ensures declarationDir is located in Rollup output directory when output.file is used',
  async () => {
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

    // this should throw an error just like the equivalent setup using output.dir above
    const wrongDirError = await t.throwsAsync(() =>
      getCode(bundle, { format: 'es', file: 'fixtures/basic/dist/index.js' }, true)
    );
    t.true(
      wrongDirError.message.includes(
        `Path of Typescript compiler option 'declarationDir' must be located inside the same directory as the Rollup 'file' option`
      ),
      `Unexpected error message: ${wrongDirError.message}`
    );
  }
);

test.sequential(
  'ensures declarationDir is allowed in Rollup output directory when output.file is used',
  async () => {
    const bundle = await rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/basic/tsconfig.json',
          declarationDir: 'fixtures/basic/dist/other',
          declaration: true
        })
      ],
      onwarn
    });

    // this should not throw an error
    await t.notThrowsAsync(() =>
      getCode(bundle, { format: 'es', file: 'fixtures/basic/dist/index.js' }, true)
    );
  }
);

test.sequential(
  'ensures output files can be written to subdirectories within the tsconfig outDir',
  async () => {
    const warnings = [];
    const outputOpts = { format: 'es', file: 'fixtures/basic/dist/esm/main.js' };
    const bundle = await rollup({
      input: 'fixtures/basic/main.ts',
      output: outputOpts,
      plugins: [
        typescript({
          tsconfig: 'fixtures/basic/tsconfig.json',
          outDir: 'fixtures/basic/dist'
        })
      ],
      onwarn(warning) {
        warnings.push(warning);
      }
    });

    // This should not throw an error
    const output = await getFiles(bundle, outputOpts);

    t.deepEqual(
      output.map((out) => out.fileName),
      ['fixtures/basic/dist/esm/main.js']
    );
    t.is(warnings.length, 0);
  }
);

test.sequential('ensures multiple outputs can be built', async () => {
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

test.sequential('supports emitting types also for single file output', async () => {
  // Navigate to folder and use default local tsconfig instead of specifying tsconfig via file path
  // as that would have the side effect that the tsconfig's path would be used as fallback path for
  // the here unspecified outputOptions.dir, in which case the original issue wouldn't show.
  process.chdir('fixtures/basic');
  const outputOpts = { format: 'es', file: 'dist/main.js' };

  const warnings = [];
  const bundle = await rollup({
    input: 'main.ts',
    output: outputOpts,
    plugins: [typescript({ declaration: true, declarationDir: 'dist' })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  // generate a single output bundle, in which case, declaration files were not correctly emitted
  const output = await getFiles(bundle, outputOpts);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['dist/main.js', 'dist/main.d.ts']
  );
  t.is(warnings.length, 0);
});

test.sequential('supports emitting declarations in correct directory for output.file', async () => {
  // Ensure even when no `output.dir` is configured, declarations are emitted to configured `declarationDir`
  process.chdir('fixtures/basic');
  const outputOpts = { format: 'es', file: 'dist/main.esm.js' };

  const warnings = [];
  const bundle = await rollup({
    input: 'main.ts',
    output: outputOpts,
    plugins: [typescript({ declaration: true, declarationDir: 'dist' })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  const output = await getFiles(bundle, outputOpts);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['dist/main.esm.js', 'dist/main.d.ts']
  );
  t.is(warnings.length, 0);
});

test.sequential('relative paths in tsconfig.json are resolved relative to the file', async () => {
  const outputOpts = { format: 'es', dir: 'fixtures/relative-dir/dist' };
  const bundle = await rollup({
    input: 'fixtures/relative-dir/main.ts',
    output: outputOpts,
    plugins: [typescript({ tsconfig: 'fixtures/relative-dir/tsconfig.json' })],
    onwarn
  });
  const output = await getFiles(bundle, outputOpts);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['fixtures/relative-dir/dist/main.js', 'fixtures/relative-dir/dist/main.d.ts']
  );

  t.true(output[1].content.includes('declare const answer = 42;'), output[1].content);
});

test.sequential('throws for unsupported module types', async () => {
  const caughtError = await t.throws(() =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'AMD' })],
      onwarn
    })
  );

  t.true(
    caughtError.message.includes(
      "The module kind should be 'ES2015', 'ESNext', 'node16' or 'nodenext', found: 'AMD'"
    ),
    `Unexpected error message: ${caughtError.message}`
  );
});

test.sequential('warns for invalid module types', async () => {
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
      message: `@rollup/plugin-typescript TS6046: Argument for '--module' option must be: 'none', 'commonjs', 'amd', 'system', 'umd', 'es6', 'es2015', 'es2020', 'es2022', 'esnext', 'node16', 'nodenext'.`
    }
  ]);
});

test.sequential('ignores case of module types', async () => {
  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', module: 'eSnExT' })],
      onwarn
    })
  );
});

test.sequential('handles async functions', async () => {
  const bundle = await rollup({
    input: 'fixtures/async/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/async/tsconfig.json' })],
    onwarn
  });
  const wait = await evaluateBundle(bundle);
  await wait(3);
  t.pass();
});

test.sequential('does not duplicate helpers', async () => {
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

test.sequential('transpiles `export class A` correctly', async () => {
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

test.sequential('transpiles ES6 features to ES5 with source maps', async () => {
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

test.sequential('reports diagnostics and throws if errors occur during transpilation', async () => {
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

test.sequential('ignore type errors if noEmitOnError is false', async () => {
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

test.sequential('works with named exports for abstract classes', async () => {
  const bundle = await rollup({
    input: 'fixtures/export-abstract-class/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/export-abstract-class/tsconfig.json' })],
    onwarn
  });
  const code = await getCode(bundle, outputOptions);
  t.true(code.length > 0, code);
});

test.sequential('should use named exports for classes', async () => {
  const bundle = await rollup({
    input: 'fixtures/export-class/main.ts',
    plugins: [typescript({ include: 'fixtures/export-class/**/*' })],
    onwarn
  });
  t.is((await evaluateBundle(bundle)).foo, 'bar');
});

test.sequential('supports overriding the TypeScript version', async () => {
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

test.sequential('should not resolve .d.ts files', async () => {
  const bundle = await rollup({
    input: 'fixtures/dts/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/dts/tsconfig.json' })],
    onwarn,
    external: ['an-import']
  });
  const imports = bundle.cache.modules[0].dependencies;
  t.deepEqual(imports, ['an-import']);
});

test.sequential('should transpile JSX if enabled', async () => {
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

test.sequential('automatically loads tsconfig.json from the current directory', async () => {
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

test.sequential('should support extends property in tsconfig', async () => {
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

test.sequential('should support extends property with given tsconfig', async () => {
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

test.sequential('should support extends property with node resolution', async () => {
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

test.sequential('complies code that uses browser functions', async () => {
  const bundle = await rollup({
    input: 'fixtures/dom/main.ts',
    plugins: [typescript({ tsconfig: './fixtures/dom/tsconfig.json' })],
    onwarn
  });

  const code = await getCode(bundle, outputOptions);

  t.true(code.includes('navigator.clipboard.readText()'), code);
});

test.sequential('allows specifying a path for tsconfig.json', async () => {
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

test.sequential('throws if tsconfig cannot be found', async () => {
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

test.sequential('should throw on bad options', async () => {
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

test.sequential('should handle re-exporting types', async () => {
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

test.sequential(
  'prevents errors due to conflicting `sourceMap`/`inlineSourceMap` options',
  async () => {
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

test.sequential('should not emit null sourceContent', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', sourcemap: true }, true);
  const sourcemap = output[0].map;
  // eslint-disable-next-line no-undefined
  t.false(sourcemap.sourcesContent.includes(undefined));
});

test.sequential('should not emit sourceContent that references a non-existent file', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    output: {
      sourcemap: true
    },
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', sourcemap: true }, true);
  const sourcemap = output[0].map;
  t.false(sourcemap.sourcesContent.includes('//# sourceMappingURL=main.js.map'));
});

test.sequential('should not fail if source maps are off', async () => {
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

test.sequential('should allow a namespace containing a class', async () => {
  const bundle = await rollup({
    input: 'fixtures/export-namespace-export-class/test.ts',
    plugins: [typescript({ tsconfig: 'fixtures/export-namespace-export-class/tsconfig.json' })],
    onwarn
  });
  const { MODE } = (await evaluateBundle(bundle)).MODE;
  const mode = new MODE();

  t.true(mode instanceof MODE);
});

test.sequential('should allow merging an exported function and namespace', async () => {
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

test.sequential('supports dynamic imports', async () => {
  const code = await getCode(
    await rollup({
      input: 'fixtures/dynamic-imports/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/dynamic-imports/tsconfig.json' })],
      onwarn
    }),
    { ...outputOptions, inlineDynamicImports: true }
  );
  t.true(code.includes("console.log('dynamic')"));
});

test.sequential('supports CommonJS imports when the output format is CommonJS', async () => {
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

test.sequential('supports optional chaining', async () => {
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

test.sequential('supports incremental build', async () => {
  process.chdir('fixtures/basic');
  // clean up artefacts from earlier builds
  await forceRemove('tsconfig.tsbuildinfo');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [
      typescript({
        tsconfig: 'tsconfig.json',
        incremental: true
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: './' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'tsconfig.tsbuildinfo']
  );
});

test.sequential('supports incremental rebuild', async () => {
  process.chdir('fixtures/incremental');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: 'dist' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );
});

test.sequential('supports incremental build for single file output', async () => {
  process.chdir('fixtures/incremental-single');
  // clean up artefacts from earlier builds
  await forceRemove('tsconfig.tsbuildinfo');
  await forceRemove('index.js');

  const warnings = [];
  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript({ outputToFilesystem: true })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  const output = await getCode(bundle, { format: 'es', file: 'main.js' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js']
  );
  t.true(fs.existsSync('tsconfig.tsbuildinfo'));
  t.is(warnings.length, 0);
});

test.sequential('supports consecutive rebuilds when watchMode is false', async () => {
  process.chdir('fixtures/incremental-watch-off');

  // IMPORTANT: The issue only happens if it's the same instance of rollup/plugin-typescript
  // Hence, generating one instance and using it twice below.
  const tsPlugin = typescript({ outputToFilesystem: true });

  const firstBundle = await rollup({
    input: 'main.ts',
    plugins: [tsPlugin],
    onwarn
  });

  const firstRun = await getCode(firstBundle, { format: 'es', dir: 'dist' }, true);
  const firstRunCode = firstRun[0].code;

  try {
    // Mutating the source file
    fs.appendFileSync('main.ts', '\nexport const REBUILD_WITH_WATCH_OFF = 1;');

    const secondBundle = await rollup({
      input: 'main.ts',
      plugins: [tsPlugin],
      onwarn
    });
    const secondRun = await getCode(secondBundle, { format: 'es', dir: 'dist' }, true);
    const secondRunCode = secondRun[0].code;

    t.notDeepEqual(firstRunCode, secondRunCode);
  } finally {
    fs.copyFile('original.txt', 'main.ts', (err) => {
      if (err) {
        t.fail(err);
      }
    });
  }
});

test.sequential('does not output to filesystem when outputToFilesystem is false', async () => {
  process.chdir('fixtures/incremental-single');
  // clean up artefacts from earlier builds
  await forceRemove('tsconfig.tsbuildinfo');
  await forceRemove('index.js');

  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript({ outputToFilesystem: false })],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', file: 'main.js' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js']
  );
  t.false(fs.existsSync('tsconfig.tsbuildinfo'));
});

test.sequential('warn about outputToFilesystem default', async () => {
  process.chdir('fixtures/incremental-single');
  // clean up artefacts from earlier builds
  await forceRemove('tsconfig.tsbuildinfo');
  await forceRemove('index.js');

  const warnings = [];
  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  const output = await getCode(bundle, { format: 'es', file: 'main.js' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js']
  );
  t.true(fs.existsSync('tsconfig.tsbuildinfo'));
  t.is(warnings.length, 1);
  t.true(
    warnings[0].message.includes(`outputToFilesystem option is defaulting to true`),
    warnings[0].message
  );
});

test.sequential('supports consecutive incremental rebuilds', async () => {
  process.chdir('fixtures/incremental');

  const firstBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });

  const firstRun = await getCode(firstBundle, { format: 'es', dir: 'dist' }, true);
  t.deepEqual(
    firstRun.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );

  const secondBundle = await rollup({
    input: 'main.ts',
    plugins: [typescript()],
    onwarn
  });
  const secondRun = await getCode(secondBundle, { format: 'es', dir: 'dist' }, true);
  t.deepEqual(
    secondRun.map((out) => out.fileName),
    ['main.js', '.tsbuildinfo']
  );
});

// https://github.com/rollup/plugins/issues/681
test.sequential(
  'supports incremental rebuilds with no change to cache when using rollup emitFile',
  async () => {
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

    const firstRun = await getCode(firstBundle, { format: 'es', dir: 'dist' }, true);
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
    const secondRun = await getCode(secondBundle, { format: 'es', dir: 'dist' }, true);
    t.deepEqual(
      secondRun.map((out) => out.fileName),
      // .tsbuildinfo should not be emitted
      ['main.js']
    );

    cleanup();
  }
);

// https://github.com/rollup/plugins/issues/681
test.sequential(
  'supports incremental rebuilds with no change to cache when using filesystem calls',
  async () => {
    process.chdir('fixtures/incremental-output-cache');
    const cleanup = async () => {
      let files;
      try {
        files = fs.readdirSync('dist');
      } catch (error) {
        if (error.code === 'ENOENT') return;
        throw error;
      }
      files.forEach((file) => fs.unlinkSync(path.join('dist', file)));
      await forceRemove('.tsbuildinfo');
    };

    await cleanup();

    const firstBundle = await rollup({
      input: 'main.ts',
      plugins: [typescript({ tsBuildInfoFile: './.tsbuildinfo' })],
      onwarn
    });

    const firstRun = await getCode(firstBundle, { format: 'es', dir: 'dist' }, true);
    t.deepEqual(
      firstRun.map((out) => out.fileName),
      ['main.js']
    );
    t.true(fs.existsSync('.tsbuildinfo'));
    await firstBundle.write({ dir: 'dist' });
    const tsBuildInfoStats = fs.statSync('.tsbuildinfo');

    const secondBundle = await rollup({
      input: 'main.ts',
      plugins: [typescript({ tsBuildInfoFile: './.tsbuildinfo' })],
      onwarn
    });
    const secondRun = await getCode(secondBundle, { format: 'es', dir: 'dist' }, true);
    t.deepEqual(
      secondRun.map((out) => out.fileName),
      ['main.js']
    );
    t.true(fs.existsSync('.tsbuildinfo'));
    const tsBuildInfoStats2 = fs.statSync('.tsbuildinfo');
    // .tsbuildinfo should not be emitted
    t.is(tsBuildInfoStats2.mtimeMs, tsBuildInfoStats.mtimeMs);
    t.is(tsBuildInfoStats2.ctimeMs, tsBuildInfoStats.ctimeMs);
    t.is(tsBuildInfoStats2.birthtimeMs, tsBuildInfoStats.birthtimeMs);

    await cleanup();
  }
);

test.skip('supports project references', async () => {
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

test.sequential('warns if sourceMap is set in Typescript but not Rollup', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', sourceMap: true })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'es' });

  t.is(warnings.length, 1);
  t.true(
    warnings[0].message.includes(`Rollup 'sourcemap' option must be set to generate source maps`),
    warnings[0].message
  );
});

test.sequential('warns if sourceMap is set in Rollup but not Typescript', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', sourceMap: false })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'es', sourcemap: true });

  t.is(warnings.length, 1);
  t.true(
    warnings[0].message.includes(
      `Typescript 'sourceMap' compiler option must be set to generate source maps`
    ),
    warnings[0].message
  );
});

test.sequential('normalizes resolved ids to avoid duplicate output on windows', async () => {
  const bundle = await rollup({
    input: ['fixtures/normalize-ids/one.js', 'fixtures/normalize-ids/two.js'],
    plugins: [
      typescript({
        include: ['*.js', '**/*.js'],
        tsconfig: 'fixtures/normalize-ids/tsconfig.json'
      })
    ]
  });

  const files = await getCode(bundle, { format: 'es' }, true);

  t.is(files.length, 2);
  t.true(files[0].fileName.includes('two.js'), files[1].fileName);
  t.true(files[0].code.includes("import { one } from './one.js';"), files[1].code);
});

test.sequential('does it support tsconfig.rootDir for filtering', async () => {
  process.chdir('fixtures/root-dir/packages/test-1');
  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript({ tsconfig: 'tsconfig.json' })]
  });

  const files = await getCode(bundle, { format: 'es' }, true);
  // Compiles with no errors
  t.is(files.length, 1);
});

test.sequential(
  'does it fail for filtering with incorrect rootDir in nested projects',
  async () => {
    process.chdir('fixtures/root-dir/packages/test-2');
    const error = await t.throwsAsync(
      rollup({
        input: 'main.ts',
        plugins: [typescript({ tsconfig: 'tsconfig.json' })]
      })
    );
    // It imports a typescript file outside CWD, hence will not get resolved
    t.is(error.code, 'UNRESOLVED_IMPORT');
  }
);

test.sequential('does manually setting filterRoot resolve nested projects', async () => {
  process.chdir('fixtures/root-dir/packages/test-2');
  const bundle = await rollup({
    input: 'main.ts',
    plugins: [typescript({ tsconfig: 'tsconfig.json', filterRoot: '../../' })]
  });
  const files = await getCode(bundle, { format: 'es' }, true);
  t.is(files.length, 1);
});

test.sequential('does not warn if sourceMap is set in Rollup and unset in Typescript', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json' })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  await getCode(bundle, { format: 'es', sourcemap: true });

  t.is(warnings.length, 0);
});

test('supports custom transformers', async () => {
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
                        return ts.factory.createArrowFunction(
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
                        return ts.factory.createReturnStatement(
                          ts.factory.createNumericLiteral('1')
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
          afterDeclarations: [
            // Change the return type to numeric
            function fixDeclarationFactory(context) {
              return function fixDeclaration(source) {
                function visitor(node) {
                  if (ts.isFunctionTypeNode(node)) {
                    return ts.factory.createFunctionTypeNode(
                      node.typeParameters,
                      [node.parameters[0]],
                      ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
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

test('supports passing a custom transformers factory', async () => {
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
        transformers: (p) => {
          program = p;
          typeChecker = p.getTypeChecker();
          return {
            before: [
              function removeOneParameterFactory(context) {
                return function removeOneParameter(source) {
                  function visitor(node) {
                    if (ts.isArrowFunction(node)) {
                      return ts.factory.createArrowFunction(
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
              }
            ],
            after: [
              // Enforce a constant numeric output
              function enforceConstantReturnFactory(context) {
                return function enforceConstantReturn(source) {
                  function visitor(node) {
                    if (ts.isReturnStatement(node)) {
                      return ts.factory.createReturnStatement(ts.factory.createNumericLiteral('1'));
                    }

                    return ts.visitEachChild(node, visitor, context);
                  }

                  return ts.visitEachChild(source, visitor, context);
                };
              }
            ],
            afterDeclarations: [
              // Change the return type to numeric
              function fixDeclarationFactory(context) {
                return function fixDeclaration(source) {
                  function visitor(node) {
                    if (ts.isFunctionTypeNode(node)) {
                      return ts.factory.createFunctionTypeNode(
                        node.typeParameters,
                        [node.parameters[0]],
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
                      );
                    }

                    return ts.visitEachChild(node, visitor, context);
                  }

                  return ts.visitEachChild(source, visitor, context);
                };
              }
            ]
          };
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

// This test randomly fails with a segfault directly at the first "await waitForWatcherEvent" before any event occurred.
// Skipping it until we can figure out what the cause is.
test.skip('picks up on newly included typescript files in watch mode', async () => {
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

test.sequential('works when code is in src directory', async () => {
  const bundle = await rollup({
    input: 'fixtures/src-dir/src/index.ts',
    output: [
      {
        dir: 'fixtures/src-dir/dist',
        format: 'es'
      }
    ],
    plugins: [
      typescript({
        tsconfig: 'fixtures/src-dir/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: 'fixtures/src-dir/dist' }, true);

  t.deepEqual(
    output.map((out) => out.fileName),
    ['index.js', 'index.d.ts']
  );
});

test.sequential('correctly resolves types in a nodenext module', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/nodenext-module/index.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/nodenext-module/tsconfig.json'
      })
    ],
    onwarn({ toString, ...warning }) {
      warnings.push(warning);
    }
  });
  const code = await getCode(bundle, outputOptions);

  t.true(code.includes('const bar = foo'), code);
  t.is(warnings.length, 1);
  t.is(warnings[0].code, 'UNRESOLVED_IMPORT');
});

test.sequential('correctly resolves types with nodenext moduleResolution', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/nodenext-resolution/index.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/nodenext-resolution/tsconfig.json'
      })
    ],
    onwarn({ toString, ...warning }) {
      warnings.push(warning);
    }
  });
  const code = await getCode(bundle, outputOptions);

  t.true(code.includes('var bar = foo'), code);
  t.is(warnings.length, 1);
  t.is(warnings[0].code, 'UNRESOLVED_IMPORT');
});

test.sequential('noForceEmit option defers to tsconfig.json for emitDeclarationOnly', async () => {
  const input = 'fixtures/noForceEmit/emitDeclarationOnly/main.ts';
  const warnings = [];
  const bundle = await rollup({
    input,
    plugins: [
      typescript({
        tsconfig: 'fixtures/noForceEmit/emitDeclarationOnly/tsconfig.json',
        noForceEmit: true
      })
    ],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  // generate a single output bundle, in which case, declaration files were not correctly emitted
  const output = await getCode(
    bundle,
    { format: 'es', file: 'fixtures/noForceEmit/emitDeclarationOnly/dist/main.js' },
    true
  );

  t.deepEqual(
    output.map((out) => out.fileName),
    // original file is passed through, main.d.ts is emitted
    ['main.js', 'main.d.ts']
  );
  t.is(warnings.length, 0);
  // test that NO transpilation happened
  const originalCode = fs.readFileSync(path.join(__dirname, input), 'utf8');
  t.is(output[0].code, originalCode);
});

test.sequential('noForceEmit option defers to tsconfig.json for noEmit', async () => {
  const input = 'fixtures/noForceEmit/noEmit/main.ts';
  const warnings = [];
  const bundle = await rollup({
    input,
    plugins: [
      typescript({ tsconfig: 'fixtures/noForceEmit/noEmit/tsconfig.json', noForceEmit: true })
    ],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  // generate a single output bundle, in which case, declaration files were not correctly emitted
  const output = await getCode(
    bundle,
    { format: 'es', file: 'fixtures/noForceEmit/noEmit/dist/main.js' },
    true
  );

  t.deepEqual(
    output.map((out) => out.fileName),
    // no `main.d.ts`, main.js is passed through
    ['main.js']
  );
  t.is(warnings.length, 0);
  // test that NO transpilation happened
  const originalCode = fs.readFileSync(path.join(__dirname, input), 'utf8');
  t.is(output[0].code, originalCode);
});

test.sequential('compiled external library', async () => {
  const input = 'fixtures/external-library-import/main.ts';
  await rollup({
    input,
    plugins: [typescript({ tsconfig: 'fixtures/external-library-import/tsconfig.json' })]
  });
  t.pass();
});

test.sequential('observes included declarations', async () => {
  const warnings = [];
  const bundle = await rollup({
    input: 'fixtures/included-declarations/main.ts',
    external: ['declared-module'],
    plugins: [typescript({ tsconfig: 'fixtures/included-declarations/tsconfig.json' })],
    onwarn(warning) {
      warnings.push(warning);
    }
  });
  t.deepEqual(warnings, []);

  const files = await getCode(bundle, { format: 'es' }, true);
  t.is(files.length, 1);
});

test.sequential('downlevels JS when allowJs is true (default include)', async () => {
  const bundle = await rollup({
    input: 'fixtures/allow-js-downlevel/src/main.js',
    plugins: [typescript({ tsconfig: 'fixtures/allow-js-downlevel/tsconfig.json' })],
    onwarn
  });
  const code = await getCode(bundle, { format: 'es' });

  // Optional chaining and nullish coalescing assignment should be transformed
  t.false(code.includes('?.'), code);
  t.false(code.includes('??='), code);

  const result = await evaluateBundle(bundle);
  t.deepEqual(result(), [1, 123]);
});

test.sequential('downlevels JS imported by TS when allowJs is true', async () => {
  const bundle = await rollup({
    input: 'fixtures/allow-js-from-ts/src/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/allow-js-from-ts/tsconfig.json' })],
    onwarn
  });
  const code = await getCode(bundle, { format: 'es' });

  t.false(code.includes('?.'), code);
  t.false(code.includes('??='), code);

  const result = await evaluateBundle(bundle);
  t.deepEqual(result(), [7, 9]);
});

test.sequential(
  'excludes user-configured outDir from processing when allowJs is true',
  async () => {
    const outDir = path.join(__dirname, 'fixtures/allow-js-from-ts/.out');
    fs.rmSync(outDir, { recursive: true, force: true });

    const bundle = await rollup({
      input: 'fixtures/allow-js-from-ts/src/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/allow-js-from-ts/tsconfig.json',
          compilerOptions: { outDir }
        })
      ],
      onwarn
    });

    try {
      // Ensure Rollup did not pull any files from the outDir into the graph
      const normalizeForCompare = (p) => {
        const r = path.resolve(p);
        return process.platform === 'win32' ? r.toLowerCase() : r;
      };
      const outDirAbs = normalizeForCompare(outDir);
      const isInside = (parent, child) => {
        const rel = path.relative(parent, normalizeForCompare(child));
        // same dir or within parent
        return !rel.startsWith('..') && !path.isAbsolute(rel);
      };
      t.true(bundle.watchFiles.every((f) => !isInside(outDirAbs, f)));
    } finally {
      await bundle.close();
      fs.rmSync(outDir, { recursive: true, force: true });
    }
  }
);

test.sequential(
  'recreates transformers per rebuild and exposes getProgram in watch mode',
  async () => {
    const observations = [];

    const dirName = path.join(__dirname, 'fixtures', 'transformers');
    const outputJs = path.join(dirName, 'main.js');

    // ensure a clean slate for emitted file
    if (fs.existsSync(outputJs)) {
      fs.unlinkSync(outputJs);
    }

    const bundle = await rollup({
      input: 'fixtures/transformers/main.ts',
      plugins: [
        typescript({
          tsconfig: false,
          compilerOptions: { module: 'esnext' },
          recreateTransformersOnRebuild: true,
          // Use a fake TS that simulates two watch rebuilds by calling afterProgramCreate twice
          typescript: fakeTypescript({
            createWatchProgram(host) {
              const makeBuilder = (id, value) => {
                const innerProgram = { id };
                return {
                  getProgram() {
                    return innerProgram;
                  },
                  emit(_, writeFile) {
                    writeFile(outputJs, `export default ${value};`);
                  }
                };
              };

              const p1 = makeBuilder('one', 101);
              host.afterProgramCreate(p1);
              p1.emit();

              const p2 = makeBuilder('two', 202);
              host.afterProgramCreate(p2);
              p2.emit();

              return { close() {} };
            }
          }),
          transformers: {
            before: [
              {
                type: 'program',
                factory(program, getProgram) {
                  observations.push({
                    p: program && program.id,
                    gp: getProgram ? getProgram().id : void 0
                  });
                  // no-op transformer
                  return function passthroughFactory(context) {
                    return function passthrough(source) {
                      return ts.visitEachChild(source, (n) => n, context);
                    };
                  };
                }
              }
            ]
          }
        })
      ],
      onwarn
    });

    try {
      await getCode(bundle, { format: 'esm', dir: dirName }, true);
      t.deepEqual(observations, [
        { p: 'one', gp: 'one' },
        { p: 'two', gp: 'two' }
      ]);
    } finally {
      await bundle.close();
      // tidy emitted file to avoid cross-test interference if ordering changes
      if (fs.existsSync(outputJs)) fs.unlinkSync(outputJs);
    }
  }
);

test.sequential('recreates typeChecker-based transformers per rebuild in watch mode', async () => {
  const observations = [];

  const dirName = path.join(__dirname, 'fixtures', 'transformers');
  const outputJs = path.join(dirName, 'main.js');

  // ensure a clean slate for emitted file
  if (fs.existsSync(outputJs)) {
    fs.unlinkSync(outputJs);
  }

  const bundle = await rollup({
    input: 'fixtures/transformers/main.ts',
    plugins: [
      typescript({
        tsconfig: false,
        compilerOptions: { module: 'esnext' },
        recreateTransformersOnRebuild: true,
        // Fake TS that simulates two watch rebuilds, each returning a distinct TypeChecker
        typescript: fakeTypescript({
          createWatchProgram(host) {
            const makeBuilder = (id, value) => {
              const innerTypeChecker = { id: `tc-${id}` };
              const innerProgram = {
                getTypeChecker() {
                  return innerTypeChecker;
                }
              };
              return {
                getProgram() {
                  return innerProgram;
                },
                emit(_, writeFile) {
                  writeFile(outputJs, `export default ${value};`);
                }
              };
            };

            const p1 = makeBuilder('one', 101);
            host.afterProgramCreate(p1);
            p1.emit();

            const p2 = makeBuilder('two', 202);
            host.afterProgramCreate(p2);
            p2.emit();

            return { close() {} };
          }
        }),
        transformers: {
          before: [
            {
              type: 'typeChecker',
              factory(typeChecker) {
                observations.push(typeChecker && typeChecker.id);
                // no-op transformer
                return function passthroughFactory(context) {
                  return function passthrough(source) {
                    return ts.visitEachChild(source, (n) => n, context);
                  };
                };
              }
            }
          ]
        }
      })
    ],
    onwarn
  });

  try {
    await getCode(bundle, { format: 'esm', dir: dirName }, true);
    t.deepEqual(observations, ['tc-one', 'tc-two']);
  } finally {
    await bundle.close();
    // tidy emitted file to avoid cross-test interference if ordering changes
    if (fs.existsSync(outputJs)) fs.unlinkSync(outputJs);
  }
});

test.sequential('defaults to legacy behavior: reuses factories across watch rebuilds', async () => {
  const dirName = path.join(__dirname, 'fixtures', 'transformers');
  const outputJs = path.join(dirName, 'main.js');
  if (fs.existsSync(outputJs)) fs.unlinkSync(outputJs);

  const seen = [];
  const bundle = await rollup({
    input: 'fixtures/transformers/main.ts',
    plugins: [
      typescript({
        tsconfig: false,
        compilerOptions: { module: 'esnext' },
        // Intentionally omit recreateTransformersOnRebuild (defaults to legacy)
        typescript: fakeTypescript({
          createWatchProgram(host) {
            const makeBuilder = (id, value) => {
              const innerProgram = { id };
              return {
                getProgram() {
                  return innerProgram;
                },
                emit(_, writeFile) {
                  writeFile(outputJs, `export default ${value};`);
                }
              };
            };

            const p1 = makeBuilder('first', 1);
            host.afterProgramCreate(p1);
            p1.emit();

            const p2 = makeBuilder('second', 2);
            host.afterProgramCreate(p2);
            p2.emit();

            return { close() {} };
          }
        }),
        transformers: {
          before: [
            {
              type: 'program',
              factory(program, getProgram) {
                seen.push({ p: program.id, gp: getProgram ? getProgram().id : void 0 });
                return (context) => (source) => ts.visitEachChild(source, (n) => n, context);
              }
            }
          ]
        }
      })
    ],
    onwarn
  });

  try {
    await getCode(bundle, { format: 'esm', dir: dirName }, true);
    // Only one factory invocation; both references point to the initial program
    t.deepEqual(seen, [{ p: 'first', gp: 'first' }]);
  } finally {
    await bundle.close();
    if (fs.existsSync(outputJs)) fs.unlinkSync(outputJs);
  }
});
