const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const url = require('..');

require('source-map-support').install();

process.chdir(__dirname);

const DEFAULT_OPTIONS = {
  emitFiles: false
};

test('should inline text files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/svg/small/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('should not copy files when limit is 0 and emitFiles is off', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/svg/nocopy/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS, limit: 0, publicPath: '' })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

// test('should copy files when limit is 0', () =>
//   run('./fixtures/svg.js', { limit: 0 }).then(() =>
//     Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`)])
//   ));

test('should inline binary files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/png/small/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('should copy large text files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/svg/large/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS, limit: 10 })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('should copy large binary files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/png/large/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS, limit: 10 })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('should use publicPath', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/png/path/main.js',
    plugins: [url({ ...DEFAULT_OPTIONS, limit: 10, publicPath: '/foo/bar/' })]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

// test('should create a nested directory for the output, if required', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: 'subdirectory/[hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/subdirectory/${pnghash}`)])
//   ));

// test('should create a file with the name and extension of the file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[name][extname]' }).then(() =>
//     Promise.all([assertExists(`output/${pngname}`)])
//   ));

// test('should create a file with the name, hash and extension of the file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[name]-[hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/png-${pnghash}`)])
//   ));

// test('should prefix the file with the parent directory of the source file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[dirname][hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/fixtures/${pnghash}`)])
//   ));

// test('should prefix the file with the parent directory of the source file, relative to the sourceDir option', () =>
//   run('./fixtures/png.js', {
//     limit: 10,
//     fileName: '[dirname][hash][extname]',
//     sourceDir: path.join(__dirname, '../')
//   }).then(() => Promise.all([assertExists(`output/test/fixtures/${pnghash}`)])));

// test('should copy the file according to destDir option', () =>
//   run('./fixtures/png.js', {
//     limit: 10,
//     fileName: '[dirname][hash][extname]',
//     destDir: path.join(__dirname, 'output/dest')
//   }).then(() => Promise.all([assertExists(`output/dest/fixtures/${pnghash}`)])));

// test('should create multiple modules and inline files', () =>
//   run(['./fixtures/svg.js', './fixtures/png.js'], {}, true).then(() =>
//     Promise.all([
//       assertOutput(asserts.pngInline, `${dir}/png.js`),
//       assertOutput(asserts.svgInline, `${dir}/svg.js`)
//     ])
//   ));

// test('should create multiple modules and copy files', () =>
//   run(['./fixtures/svg.js', './fixtures/png.js'], { limit: 0 }, true).then(() =>
//     Promise.all([
//       assertOutput(asserts.pngExport, `${dir}/png.js`),
//       assertOutput(asserts.svgExport, `${dir}/svg.js`),
//       assertExists(`${dir}/${svghash}`),
//       assertExists(`${dir}/${pnghash}`)
//     ])
//   ));
