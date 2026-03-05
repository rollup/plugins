const path = require('path');

const { rollup } = require('rollup');

// eslint-disable-next-line import/no-unresolved, import/extensions
const alias = require('@rollup/plugin-alias');

const { testBundle } = require('../../../util/test');

const sucrase = require('..');

require('source-map-support').install();

process.chdir(__dirname);

function getBundle(input, sucraseOptions, rollupOptions) {
  return rollup({
    /**
     * Explicitly set Rollup's top-level `this` context to silence build-time warnings about `this` being undefined in ES modules.
     * This is a bundler-level concern only and does not affect the plugin's transform behavior, which runs before bundling.
     */
    context: 'this',
    input,
    plugins: [sucrase(sucraseOptions)],
    ...rollupOptions
  });
}

test('calls without options', async () => {
  const plugin = sucrase();
  expect(plugin.name).toBe('sucrase');
});

test('does not transform files excluded by filter', async () => {
  const plugin = sucrase({ exclude: '**/*.ts', transforms: ['typescript'] });
  const result = plugin.transform('const x: number = 1;', 'foo.ts');
  expect(result).toBeNull();
});

test('converts jsx', async () => {
  const bundle = await getBundle('fixtures/jsx/main.js', { transforms: ['jsx'] });
  return testBundle(undefined, bundle);
});

test('converts jsx with custom jsxPragma', async () => {
  const bundle = await getBundle('fixtures/jsx/main.js', {
    transforms: ['jsx'],
    jsxPragma: 'FakeReactCreateElement'
  });
  return testBundle(undefined, bundle);
});

test('converts jsx with jsxRuntime automatic', async () => {
  const bundle = await getBundle(
    'fixtures/jsx-runtime/main.js',
    { transforms: ['jsx'], jsxRuntime: 'automatic' },
    { external: ['react/jsx-dev-runtime'] }
  );
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  // Check that the code uses the automatic runtime instead of React.createElement
  expect(code).toMatch(/require\(['"]react\/jsx-dev-runtime['"]\)/);
  expect(code).not.toMatch(/React\.createElement/);
});

test('converts typescript', async () => {
  const bundle = await getBundle('fixtures/typescript/main.js', { transforms: ['typescript'] });
  return testBundle(undefined, bundle);
});

// Note: Windows struggles with this test setup as trying to read a directory
const testIfNotWindows = process.platform === 'win32' ? test.skip : test;

testIfNotWindows('converts typescript with aliases', async () => {
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

  return testBundle(undefined, bundle);
});

test('resolves typescript directory imports', async () => {
  const bundle = await getBundle('fixtures/typescript-resolve-directory/main.js', {
    transforms: ['typescript']
  });

  return testBundle(undefined, bundle);
});

test('converts typescript jsx ("tsx")', async () => {
  const bundle = await getBundle('fixtures/typescript-with-tsx/main.js', {
    transforms: ['typescript', 'jsx']
  });

  return testBundle(undefined, bundle);
});

test('converts jsx with jsxImportSource', async () => {
  const bundle = await getBundle(
    'fixtures/jsx-import-source/main.js',
    { transforms: ['jsx'], jsxRuntime: 'automatic', jsxImportSource: 'preact' },
    { external: ['preact/jsx-dev-runtime'] }
  );
  const { output } = await bundle.generate({ format: 'cjs', exports: 'auto' });
  const [{ code }] = output;
  expect(code).toMatch(/require\(['"]preact\/jsx-dev-runtime['"]\)/);
  expect(code).not.toMatch(/['"]react\/jsx-dev-runtime['"]/);
});

test('preserveDynamicImport keeps import() expression', async () => {
  const bundle = await getBundle('fixtures/preserve-dynamic-import/main.js', {
    transforms: ['imports'],
    preserveDynamicImport: true
  });
  const { output } = await bundle.generate({ format: 'es' });
  const [{ code }] = output;
  expect(code).toMatch(/import\(/);
});

test('injectCreateRequireForImportRequire emits createRequire', async () => {
  const bundle = await getBundle(
    'fixtures/inject-create-require/main.ts',
    {
      transforms: ['typescript'],
      injectCreateRequireForImportRequire: true
    },
    { external: ['foo', 'module'] }
  );
  const { output } = await bundle.generate({ format: 'es' });
  const [{ code }] = output;
  expect(code).toMatch(/createRequire/);
});
