const { readFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const resolve = require('rollup-plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/yarn-bare');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('yarn, bare', async (t) => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall({ manager: 'yarn' }), resolve()]
  });
  const lock = readFileSync('yarn.lock', 'utf-8').replace(/(\s+)integrity(.*)(\s+)/, '\n');
  t.snapshot(readFileSync('package.json', 'utf-8'));
  t.snapshot(lock);
});

test.after(async () => {
  await del(['node_modules', 'package.json', 'yarn.lock']);
});
