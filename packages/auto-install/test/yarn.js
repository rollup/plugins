const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/yarn');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('yarn', async () => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    // mock the call to yarn here. yarn has had consistent issues in this test env
    plugins: [autoInstall({ commands: { yarn: 'echo yarn > yarn.lock' } }), nodeResolve()]
  });
  const lockFile = readFileSync('yarn.lock', 'utf-8');
  // snapshots for this are a nightmare cross-platform
  expect(/yarn\s+node-noop/.test(lockFile)).toBeTruthy();
}, 50000);

afterAll(async () => {
  await del(['node_modules', 'package.json']);
  writeFileSync('yarn.lock', '');
});
