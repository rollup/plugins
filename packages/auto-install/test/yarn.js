const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const resolve = require('rollup-plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/yarn');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');
const lockFile = join(cwd, 'yarn.lock');

process.chdir(cwd);

test('yarn', async (t) => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall(), resolve()]
  });
  const lock = readFileSync('yarn.lock', 'utf-8').replace(/\r\n/g, '\n');
  t.snapshot(lock);
});

test.after(async () => {
  await del(['node_modules', 'package.json']);
  writeFileSync(lockFile, '');
});
