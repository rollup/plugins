const { readFileSync } = require('fs');
const { join, posix, sep, resolve } = require('path');

const del = require('del');
const globby = require('globby');
const { rollup } = require('rollup');

const url = require('..');
require('source-map-support').install();

process.chdir(__dirname);
const outputFile = 'output/bundle.js';
const outputDir = 'output/';
const run = async (type, opts) => {
  const defaults = {
    emitFiles: false,
    publicPath: ''
  };
  const options = {
    ...defaults,
    ...opts
  };
  const bundle = await rollup({
    input: `fixtures/${type}.js`,
    plugins: [url(options)]
  });
  await bundle.write({
    format: 'es',
    file: outputFile
  });
  const code = readFileSync(outputFile, 'utf-8');
  // Windows fix, glob paths must be in unix format
  const glob = join(outputDir, `**/*.${type}`).split(sep).join(posix.sep);
  expect(code).toMatchSnapshot();
  expect(await globby(glob)).toMatchSnapshot();
};
beforeEach(() => del(outputDir));
test.sequential('inline png files', async () => {
  await run('png', {
    limit: 10 * 1024
  });
});
test.sequential('inline jpg files', async () => {
  await run('jpg', {
    limit: 10 * 1024
  });
});
test.sequential('inline jpeg files', async () => {
  await run('jpeg', {
    limit: 10 * 1024
  });
});
test.sequential('inline gif files', async () => {
  await run('gif', {
    limit: 10 * 1024
  });
});
test.sequential('inline webp files', async () => {
  await run('webp', {
    limit: 10 * 1024
  });
});
test.sequential('inline text files', async () => {
  await run('svg', {
    limit: 10 * 1024
  });
});
test.sequential('inline "large" files', async () => {
  await run('svg', {
    limit: 10
  });
});
test.sequential('limit: 0, emitFiles: false, publicPath: empty', async () => {
  await run('svg', {
    limit: 0,
    publicPath: '',
    emitFiles: false
  });
});
test.sequential('copy files, limit: 0', async () => {
  await run('svg', {
    limit: 0,
    emitFiles: true
  });
});
test.sequential('copy "large" binary files, limit: 10', async () => {
  await run('svg', {
    limit: 10,
    emitFiles: true
  });
});
test.sequential('copy files with include by absolute path, limit: 0', async () => {
  await run('svg', {
    limit: 0,
    emitFiles: true,
    include: [resolve('.', 'fixtures', '*.svg')]
  });
});
test.sequential('use publicPath', async () => {
  await run('png', {
    limit: 10,
    publicPath: '/batman/'
  });
});
test.sequential('use publicPath with file that has empty dirname', async () => {
  await run('png', {
    limit: 10,
    publicPath: '/batman/',
    emitFiles: true,
    fileName: '[dirname][hash][extname]',
    sourceDir: join(__dirname, './fixtures')
  });
});
test.sequential('create a nested directory for the output, if required', async () => {
  await run('png', {
    limit: 10,
    emitFiles: true,
    fileName: 'joker/[hash][extname]'
  });
});
test.sequential('create a file with the name and extension of the file', async () => {
  await run('png', {
    limit: 10,
    emitFiles: true,
    fileName: '[name][extname]'
  });
});
test.sequential('create a file with the name, hash and extension of the file', async () => {
  await run('png', {
    limit: 10,
    emitFiles: true,
    fileName: '[name]-[hash][extname]'
  });
});
test.sequential('prefix the file with the parent directory of the source file', async () => {
  await run('png', {
    limit: 10,
    emitFiles: true,
    fileName: '[dirname][hash][extname]'
  });
});
test.sequential(
  'prefix the file with the parent directory of the source file, relative to the sourceDir option',
  async () => {
    await run('png', {
      limit: 10,
      emitFiles: true,
      fileName: '[dirname][hash][extname]',
      sourceDir: join(__dirname, '..')
    });
  }
);
test.sequential('copy the file according to destDir option', async () => {
  await run('png', {
    limit: 10,
    emitFiles: true,
    fileName: '[dirname][hash][extname]',
    destDir: join(__dirname, 'output/dest')
  });
});
