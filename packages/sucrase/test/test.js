const path = require('path');

const test = require('ava');
const { rollup } = require('rollup');

// eslint-disable-next-line import/no-unresolved, import/extensions
const alias = require('@rollup/plugin-alias');

const { testBundle } = require('../../../util/test');

const sucrase = require('..');

require('source-map-support').install();

process.chdir(__dirname);

function getBundle(input, sucraseOptions, rollupOptions) {
  return rollup({
    input,
    context: 'this',
    plugins: [sucrase(sucraseOptions)],
    ...rollupOptions
  });
}

test('calls without options', async (t) => {
  const plugin = sucrase();
  t.is(plugin.name, 'sucrase');
});

test('does not transform files excluded by filter', async (t) => {
  const plugin = sucrase({ exclude: '**/*.ts', transforms: ['typescript'] });
  const result = plugin.transform('const x: number = 1;', 'foo.ts');
  t.is(result, null);
});

test('converts jsx', async (t) => {
  const bundle = await getBundle('fixtures/jsx/main.js', { transforms: ['jsx'] });
  t.plan(1);
  return testBundle(t, bundle);
});

test('converts jsx with custom jsxPragma', async (t) => {
  const bundle = await getBundle('fixtures/jsx/main.js', {
    transforms: ['jsx'],
    jsxPragma: 'FakeReactCreateElement'
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('converts jsx with jsxRuntime automatic', async (t) => {
  const bundle = await getBundle(
    'fixtures/jsx-runtime/main.js',
    { transforms: ['jsx'], jsxRuntime: 'automatic' },
    { external: ['react/jsx-dev-runtime'] }
  );
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  // Check that the code uses the automatic runtime instead of React.createElement
  t.regex(code, /require\(['"]react\/jsx-dev-runtime['"]\)/);
  t.notRegex(code, /React\.createElement/);
});

test('converts typescript', async (t) => {
  const bundle = await getBundle('fixtures/typescript/main.js', { transforms: ['typescript'] });
  t.plan(4);
  return testBundle(t, bundle);
});

// Note: Windows struggles with this test setup as trying to read a directory
if (process.platform !== 'win32') {
  test('converts typescript with aliases', async (t) => {
    const bundle = await rollup({
      input: 'fixtures/typescript-with-aliases/main.js',
      plugins: [
        sucrase({ transforms: ['typescript'] }),
        alias({
          entries: [
            {
              find: '~src',
              replacement: path.resolve(__dirname, 'fixtures', 'typescript-with-aliases', 'src')
            }
          ]
        })
      ]
    });
    t.plan(1);

    return testBundle(t, bundle);
  });
}

test('resolves typescript directory imports', async (t) => {
  const bundle = await getBundle('fixtures/typescript-resolve-directory/main.js', {
    transforms: ['typescript']
  });
  t.plan(2);

  return testBundle(t, bundle);
});

test('converts typescript jsx ("tsx")', async (t) => {
  const bundle = await getBundle('fixtures/typescript-with-tsx/main.js', {
    transforms: ['typescript', 'jsx']
  });
  t.plan(5);

  return testBundle(t, bundle);
});

test('converts jsx with jsxImportSource', async (t) => {
  const bundle = await getBundle(
    'fixtures/jsx-import-source/main.js',
    { transforms: ['jsx'], jsxRuntime: 'automatic', jsxImportSource: 'preact' },
    { external: ['preact/jsx-dev-runtime'] }
  );
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  t.regex(code, /require\(['"]preact\/jsx-dev-runtime['"]\)/);
  t.notRegex(code, /['"]react\/jsx-dev-runtime['"]/);
});
