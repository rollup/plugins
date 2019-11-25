const test = require('ava');
const { rollup } = require('rollup');

const url = require('..');

require('source-map-support').install();

process.chdir(__dirname);

const defaultOptions = {
  emitFiles: false
};

test('should inline text files', () =>
  run('./fixtures/svg.js', 10 * 1024).then(() =>
    Promise.all([assertOutput(asserts.svgInline), assertExists(`output/${svghash}`, false)])
  ));

test('should not copy files when limit is 0 and emitFiles is off', () =>
  run('./fixtures/svg.js', { limit: 0, publicPath: '', emitFiles: false }).then(() =>
    Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`, false)])
  ));

test('should copy files when limit is 0', () =>
  run('./fixtures/svg.js', { limit: 0 }).then(() =>
    Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`)])
  ));

test('should inline binary files', () =>
  run('./fixtures/png.js', { limit: 10 * 1024 }).then(() =>
    Promise.all([assertOutput(asserts.pngInline), assertExists(`output/${pnghash}`, false)])
  ));

test('should copy large text files', () =>
  run('./fixtures/svg.js', { limit: 10 }).then(() =>
    Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`)])
  ));

test('should copy large binary files', () =>
  run('./fixtures/png.js', { limit: 10 }).then(() =>
    Promise.all([assertOutput(asserts.pngExport), assertExists(`output/${pnghash}`)])
  ));

test('should use publicPath', () =>
  run('./fixtures/png.js', { limit: 10, publicPath: '/foo/bar/' }).then(() =>
    Promise.all([assertOutput(`var png = "/foo/bar/${pnghash}";\nexport default png;`)])
  ));

test('should create a nested directory for the output, if required', () =>
  run('./fixtures/png.js', { limit: 10, fileName: 'subdirectory/[hash][extname]' }).then(() =>
    Promise.all([assertExists(`output/subdirectory/${pnghash}`)])
  ));

test('should create a file with the name and extension of the file', () =>
  run('./fixtures/png.js', { limit: 10, fileName: '[name][extname]' }).then(() =>
    Promise.all([assertExists(`output/${pngname}`)])
  ));

test('should create a file with the name, hash and extension of the file', () =>
  run('./fixtures/png.js', { limit: 10, fileName: '[name]-[hash][extname]' }).then(() =>
    Promise.all([assertExists(`output/png-${pnghash}`)])
  ));

test('should prefix the file with the parent directory of the source file', () =>
  run('./fixtures/png.js', { limit: 10, fileName: '[dirname][hash][extname]' }).then(() =>
    Promise.all([assertExists(`output/fixtures/${pnghash}`)])
  ));

test('should prefix the file with the parent directory of the source file, relative to the sourceDir option', () =>
  run('./fixtures/png.js', {
    limit: 10,
    fileName: '[dirname][hash][extname]',
    sourceDir: path.join(__dirname, '../')
  }).then(() => Promise.all([assertExists(`output/test/fixtures/${pnghash}`)])));

test('should copy the file according to destDir option', () =>
  run('./fixtures/png.js', {
    limit: 10,
    fileName: '[dirname][hash][extname]',
    destDir: path.join(__dirname, 'output/dest')
  }).then(() => Promise.all([assertExists(`output/dest/fixtures/${pnghash}`)])));

test('should create multiple modules and inline files', async (t) =>
  run(['./fixtures/svg.js', './fixtures/png.js'], {}, true).then(() =>
    Promise.all([
      assertOutput(asserts.pngInline, `${dir}/png.js`),
      assertOutput(asserts.svgInline, `${dir}/svg.js`)
    ])
  ));

test('should create multiple modules and copy files', async (t) =>
  run(['./fixtures/svg.js', './fixtures/png.js'], { limit: 0 }, true).then(() =>
    Promise.all([
      assertOutput(asserts.pngExport, `${dir}/png.js`),
      assertOutput(asserts.svgExport, `${dir}/svg.js`),
      assertExists(`${dir}/${svghash}`),
      assertExists(`${dir}/${pnghash}`)
    ])
  ));
