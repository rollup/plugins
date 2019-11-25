describe('rollup-plugin-node-resolve', () => {
  it('finds a module with jsnext:main', () =>
    rollup
      .rollup({
        input: 'samples/jsnext/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve({ mainFields: ['jsnext:main', 'module', 'main'] })]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'JSNEXT');
      }));

  it('finds and converts a basic CommonJS module', () =>
    rollup
      .rollup({
        input: 'samples/commonjs/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'It works!');
      }));

  it('handles a trailing slash', () =>
    rollup
      .rollup({
        input: 'samples/trailing-slash/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve({ mainFields: ['main'] }), commonjs()]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'It works!');
      }));

  it('finds a file inside a package directory', () =>
    rollup
      .rollup({
        input: 'samples/granular/main.js',
        onwarn: expectNoWarnings,
        plugins: [
          nodeResolve(),
          babel({
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
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'FOO');
      }));

  it('loads local directories by finding index.js within them', () =>
    rollup
      .rollup({
        input: 'samples/local-index/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve()]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 42);
      }));

  it('loads package directories by finding index.js within them', () =>
    rollup
      .rollup({
        input: 'samples/package-index/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve()]
      })
      .then((bundle) =>
        bundle.generate({
          format: 'cjs'
        })
      )
      .then((generated) => {
        assert.ok(~generated.output[0].code.indexOf('setPrototypeOf'));
      }));

  it('supports non-standard extensions', () =>
    rollup
      .rollup({
        input: 'samples/extensions/main.js',
        onwarn: expectNoWarnings,
        plugins: [
          nodeResolve({
            extensions: ['.js', '.wut']
          })
        ]
      })
      .then(executeBundle));

  it('ignores IDs with null character', () =>
    Promise.resolve(nodeResolve().resolveId('\0someid', 'test.js')).then((result) => {
      assert.equal(result, null);
    }));

  it('finds and uses an .mjs module', () =>
    rollup
      .rollup({
        input: 'samples/module-mjs/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve({ preferBuiltins: false })]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'MODULE-MJS');
      }));

  it('supports ./ in entry filename', () =>
    rollup
      .rollup({
        input: './samples/jsnext/main.js',
        onwarn: expectNoWarnings,
        plugins: [nodeResolve({})]
      })
      .then(executeBundle)
      .then((module) => {
        assert.equal(module.exports, 'MAIN');
      }));

  it('throws error if local id is not resolved', () => {
    const input = path.join('samples', 'unresolved-local', 'main.js');
    return rollup
      .rollup({
        input,
        onwarn: expectNoWarnings,
        plugins: [nodeResolve()]
      })
      .then(
        () => {
          throw Error('test should fail');
        },
        (err) => {
          assert.equal(err.message, `Could not resolve './foo' from ${input}`);
        }
      );
  });

  it('allows custom options', () =>
    rollup
      .rollup({
        input: 'samples/custom-resolve-options/main.js',
        onwarn: expectNoWarnings,
        plugins: [
          nodeResolve({
            customResolveOptions: {
              moduleDirectory: 'js_modules'
            }
          })
        ]
      })
      .then((bundle) => {
        assert.equal(
          bundle.cache.modules[0].id,
          path.resolve(__dirname, 'samples/custom-resolve-options/js_modules/foo.js')
        );
      }));

  it('ignores deep-import non-modules', () =>
    rollup
      .rollup({
        input: 'samples/deep-import-non-module/main.js',
        onwarn: expectWarnings([
          {
            code: 'UNRESOLVED_IMPORT',
            source: 'foo/deep'
          }
        ]),
        plugins: [
          nodeResolve({
            modulesOnly: true
          })
        ]
      })
      .then(getBundleImports)
      .then((imports) => assert.deepEqual(imports, ['foo/deep'])));

  it('generates manual chunks', () => {
    const chunkName = 'mychunk';
    return rollup
      .rollup({
        input: 'samples/manualchunks/main.js',
        onwarn: expectNoWarnings,
        manualChunks: {
          [chunkName]: ['simple']
        },
        plugins: [nodeResolve()]
      })
      .then((bundle) =>
        bundle.generate({
          format: 'esm',
          chunkFileNames: '[name]'
        })
      )
      .then((generated) => {
        assert.ok(generated.output.find(({ fileName }) => fileName === chunkName));
      });
  });

  it('resolves dynamic imports', () =>
    rollup
      .rollup({
        input: 'samples/dynamic/main.js',
        onwarn: expectNoWarnings,
        inlineDynamicImports: true,
        plugins: [nodeResolve()]
      })
      .then(executeBundle)
      .then(({ exports }) => exports.then((result) => assert.equal(result.default, 42))));

  it('handles package side-effects', () =>
    rollup
      .rollup({
        input: 'samples/side-effects/main.js',
        plugins: [nodeResolve()]
      })
      .then(executeBundle)
      .then(() => {
        assert.deepStrictEqual(global.sideEffects, [
          'false-dep1',
          'true-dep1',
          'true-dep2',
          'true-index',
          'array-dep1',
          'array-dep3',
          'array-dep5',
          'array-index'
        ]);
        delete global.sideEffects;
      }));
});
