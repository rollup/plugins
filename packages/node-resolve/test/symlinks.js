const fs = require('fs');
const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

function createMissingDirectories() {
  createDirectory('symlinked/first/node_modules');
  createDirectory('symlinked/second/node_modules');
  createDirectory('symlinked/third/node_modules');
}

function createDirectory(pathToDir) {
  if (!fs.existsSync(pathToDir)) {
    fs.mkdirSync(pathToDir);
  }
}

function linkDirectories() {
  fs.symlinkSync('../../second', 'symlinked/first/node_modules/second', 'dir');
  fs.symlinkSync('../../third', 'symlinked/first/node_modules/third', 'dir');
  fs.symlinkSync('../../third', 'symlinked/second/node_modules/third', 'dir');
}

function unlinkDirectories() {
  fs.unlinkSync('symlinked/first/node_modules/second');
  fs.unlinkSync('symlinked/first/node_modules/third');
  fs.unlinkSync('symlinked/second/node_modules/third');
}

test.beforeEach(() => {
  createMissingDirectories();
  linkDirectories();
});

test.afterEach.always(() => {
  unlinkDirectories();
});

test.serial('resolves symlinked packages', async (t) => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports.number1, module.exports.number2);
});

test.serial('resolves symlinked packages with browser object', async (t) => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve({ browser: true })]
  });
  const { module } = await testBundle(t, bundle);
  t.is(module.exports.number1, 'not random string');
});

test.serial('preserves symlinks if `preserveSymlinks` is true', async (t) => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [nodeResolve()],
    preserveSymlinks: true
  });
  const { module } = await testBundle(t, bundle);
  t.not(module.exports.number1, module.exports.number2);
});
