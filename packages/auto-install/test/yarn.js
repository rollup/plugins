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

process.chdir(cwd);

test('yarn', async (t) => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    // mock the call to yarn here. yarn has had consistent issues in this test env
    plugins: [autoInstall({ commands: { yarn: 'echo "yarn" > yarn.lock' } }), resolve()]
  });
  const lockFile = readFileSync('yarn.lock', 'utf-8');
  t.snapshot(lockFile);
});

test.after(async () => {
  await del(['node_modules', 'package.json']);
  writeFileSync('yarn.lock', '');
});
