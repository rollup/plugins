const { join, resolve } = require('path');

const test = require('ava');
const { rollup } = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');

const { getCode, getImports, testBundle } = require('../../../util/test');

const nodeResolve = require('..');

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

test('allows custom options', async (t) => {
  const bundle = await rollup({
    input: 'custom-resolve-options/main.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        customResolveOptions: {
          moduleDirectory: 'js_modules'
        }
      })
    ]
  });

  t.is(bundle.cache.modules[0].id, resolve('custom-resolve-options/js_modules/foo.js'));
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

test('handles package side-effects', async (t) => {
  const bundle = await rollup({
    input: 'side-effects.js',
    plugins: [nodeResolve()]
  });
  await testBundle(t, bundle);
  t.snapshot(global.sideEffects);

  delete global.sideEffects;
});
