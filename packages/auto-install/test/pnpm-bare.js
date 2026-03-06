const { readFileSync } = require('fs');
const { join } = require('path');

const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/pnpm-bare');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('pnpm, bare', async () => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall({ manager: 'pnpm' }), nodeResolve()]
  });
  const json = JSON.parse(readFileSync('package.json', 'utf-8'));
  // snapshots for this are a nightmare cross-platform
  expect('node-noop' in json.dependencies).toBeTruthy();
}, 50000);

afterAll(async () => {
  await del(['node_modules', 'package.json', 'pnpm-lock.yaml']);
});
