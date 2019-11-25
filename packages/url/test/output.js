const { readFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const globby = require('globby');
const { rollup } = require('rollup');

const url = require('..');

require('source-map-support').install();

process.chdir(__dirname);

const defaultOptions = {
  emitFiles: false
};
const outputFile = 'output/bundle.js';
const outputDir = 'output/';

// const writeOptions = {
//   format: 'es'
// }
//
// if (!experimentalCodeSplitting) {
//   Object.assign(writeOptions, {
//     file: dest
//   })
// } else {
//   Object.assign(writeOptions, {
//     dir
//   })
// }

test('copy files when limit is 0', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/svg.js',
    plugins: [url({ ...defaultOptions, limit: 0 })]
  });
  await bundle.write({ format: 'es', file: outputFile });
  const code = readFileSync(outputFile, 'utf-8');
  const glob = join(outputDir, '*.svg');

  t.snapshot(code);
  t.snapshot(await globby(glob));

  // run('./fixtures/svg.js', { limit: 0 }).then(() =>
  //   Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`)])
  // ));
});

// test('copy files when limit is 0', () =>
//   run('./fixtures/svg.js', { limit: 0 }).then(() =>
//     Promise.all([assertOutput(asserts.svgExport), assertExists(`output/${svghash}`)])
//   ));

// test('create a nested directory for the output, if required', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: 'subdirectory/[hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/subdirectory/${pnghash}`)])
//   ));

// test('create a file with the name and extension of the file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[name][extname]' }).then(() =>
//     Promise.all([assertExists(`output/${pngname}`)])
//   ));

// test('create a file with the name, hash and extension of the file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[name]-[hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/png-${pnghash}`)])
//   ));

// test('prefix the file with the parent directory of the source file', () =>
//   run('./fixtures/png.js', { limit: 10, fileName: '[dirname][hash][extname]' }).then(() =>
//     Promise.all([assertExists(`output/fixtures/${pnghash}`)])
//   ));

// test('prefix the file with the parent directory of the source file, relative to the sourceDir option', () =>
//   run('./fixtures/png.js', {
//     limit: 10,
//     fileName: '[dirname][hash][extname]',
//     sourceDir: path.join(__dirname, '../')
//   }).then(() => Promise.all([assertExists(`output/test/fixtures/${pnghash}`)])));

// test('copy the file according to destDir option', () =>
//   run('./fixtures/png.js', {
//     limit: 10,
//     fileName: '[dirname][hash][extname]',
//     destDir: path.join(__dirname, 'output/dest')
//   }).then(() => Promise.all([assertExists(`output/dest/fixtures/${pnghash}`)])));

// test('create multiple modules and inline files', () =>
//   run(['./fixtures/svg.js', './fixtures/png.js'], {}, true).then(() =>
//     Promise.all([
//       assertOutput(asserts.pngInline, `${dir}/png.js`),
//       assertOutput(asserts.svgInline, `${dir}/svg.js`)
//     ])
//   ));

// test('create multiple modules and copy files', () =>
//   run(['./fixtures/svg.js', './fixtures/png.js'], { limit: 0 }, true).then(() =>
//     Promise.all([
//       assertOutput(asserts.pngExport, `${dir}/png.js`),
//       assertOutput(asserts.svgExport, `${dir}/svg.js`),
//       assertExists(`${dir}/${svghash}`),
//       assertExists(`${dir}/${pnghash}`)
//     ])
//   ));
