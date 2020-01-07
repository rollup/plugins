const { readFileSync } = require('fs');
const { join, posix, sep } = require('path');

const test = require('ava');
const del = require('del');
const globby = require('globby');
const { rollup } = require('rollup');

const url = require('..');

require('source-map-support').install();

process.chdir(__dirname);

const outputFile = 'output/bundle.js';
const outputDir = 'output/';

const run = async (t, type, opts) => {
  const defaults = { emitFiles: false, publicPath: '' };
  const options = { ...defaults, ...opts };
  const bundle = await rollup({
    input: `fixtures/${type}.js`,
    plugins: [url(options)]
  });
  await bundle.write({ format: 'es', file: outputFile });
  const code = readFileSync(outputFile, 'utf-8');
  // Windows fix, glob paths must be in unix format
  const glob = join(outputDir, `**/*.${type}`)
    .split(sep)
    .join(posix.sep);

  t.snapshot(code);
  t.snapshot(await globby(glob));
};

test.beforeEach(() => del(outputDir));

test.serial('inline binary files', async (t) => {
  await run(t, 'png', { limit: 10 * 1024 });
});

test.serial('inline text files', async (t) => {
  await run(t, 'svg', { limit: 10 * 1024 });
});

test.serial('inline "large" files', async (t) => {
  await run(t, 'svg', { limit: 10 });
});

test.serial('limit: 0, emitFiles: false, publicPath: empty', async (t) => {
  await run(t, 'svg', { limit: 0, publicPath: '', emitFiles: false });
});

test.serial('copy files, limit: 0', async (t) => {
  await run(t, 'svg', { limit: 0, emitFiles: true });
});

test.serial('copy "large" binary files, limit: 10', async (t) => {
  await run(t, 'svg', { limit: 10, emitFiles: true });
});

test.serial('use publicPath', async (t) => {
  await run(t, 'png', { limit: 10, publicPath: '/batman/' });
});

test.serial('create a nested directory for the output, if required', async (t) => {
  await run(t, 'png', { limit: 10, emitFiles: true, fileName: 'joker/[hash][extname]' });
});

test.serial('create a file with the name and extension of the file', async (t) => {
  await run(t, 'png', { limit: 10, emitFiles: true, fileName: '[name][extname]' });
});

test.serial('create a file with the name, hash and extension of the file', async (t) => {
  await run(t, 'png', { limit: 10, emitFiles: true, fileName: '[name]-[hash][extname]' });
});

test.serial('prefix the file with the parent directory of the source file', async (t) => {
  await run(t, 'png', { limit: 10, emitFiles: true, fileName: '[dirname][hash][extname]' });
});

test.serial(
  'prefix the file with the parent directory of the source file, relative to the sourceDir option',
  async (t) => {
    await run(t, 'png', {
      limit: 10,
      emitFiles: true,
      fileName: '[dirname][hash][extname]',
      sourceDir: join(__dirname, '..')
    });
  }
);

test.serial('copy the file according to destDir option', async (t) => {
  await run(t, 'png', {
    limit: 10,
    emitFiles: true,
    fileName: '[dirname][hash][extname]',
    destDir: join(__dirname, 'output/dest')
  });
});
