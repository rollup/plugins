const { readFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const resolve = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/npm-bare');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('npm, bare', async (t) => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall(), resolve()]
  });
  t.snapshot(readFileSync('package.json', 'utf-8'));
  t.snapshot(readFileSync('package-lock.json', 'utf-8'));
});

test.after(async () => {
  await del(['node_modules', 'package.json', 'package-lock.json']);
});
