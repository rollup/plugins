const fs = require('fs');
const { join } = require('path');

const { rollup } = require('rollup');

const { testBundle } = require('../../../util/test');
const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));
const avaAssertions = {
  is(actual, expected, message) {
    expect(actual, message).toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, message).toEqual(expected);
  }
};
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
beforeEach(() => {
  createMissingDirectories();
  linkDirectories();
});
afterEach(() => {
  unlinkDirectories();
});
test.sequential('resolves symlinked packages', async () => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [nodeResolve()]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.number1).toBe(module.exports.number2);
});
test.sequential('resolves symlinked packages with browser object', async () => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        browser: true
      })
    ]
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.number1).toBe('not random string');
});
test.sequential('preserves symlinks if `preserveSymlinks` is true', async () => {
  const bundle = await rollup({
    input: 'symlinked/first/index.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [nodeResolve()],
    preserveSymlinks: true
  });
  const { module } = await testBundle(avaAssertions, bundle);
  expect(module.exports.number1).not.toBe(module.exports.number2);
});
