const { readFileSync } = require('fs');
const { join } = require('path');

const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/npm-bare');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('npm, bare', async () => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall(), nodeResolve()]
  });
  expect(readFileSync('package.json', 'utf-8')).toMatchSnapshot();
  expect(readFileSync('package-lock.json', 'utf-8').includes('"node-noop"')).toBeTruthy();
}, 50000);

afterAll(async () => {
  await del(['node_modules', 'package.json', 'package-lock.json']);
});
