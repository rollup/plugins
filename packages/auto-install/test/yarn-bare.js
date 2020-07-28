const { readFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/yarn-bare');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

test('yarn, bare', async (t) => {
  t.timeout(30000);
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [
      // mock the call to yarn here. yarn has had consistent issues in this test env
      autoInstall({ manager: 'yarn', commands: { yarn: 'echo yarn.bare > yarn.lock' } }),
      nodeResolve()
    ]
  });
  const lockFile = readFileSync('yarn.lock', 'utf-8');
  // snapshots for this are a nightmare cross-platform
  t.truthy(/yarn\.bare\s+node-noop/.test(lockFile));
});

test.after(async () => {
  await del(['node_modules', 'package.json', 'yarn.lock']);
});
