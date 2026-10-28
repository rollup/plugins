const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/pnpm');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');

process.chdir(cwd);

// pnpm would otherwise discover the monorepo workspace root above the fixture and regenerate
// its lockfile. The fixture pnpm-workspace.yaml anchors workspace detection to the fixture
// directory; ensure the fixture installs leave the workspace root lockfile untouched.
const rootLockfile = join(__dirname, '../../../pnpm-lock.yaml');
const originalLockfileContent = readFileSync(rootLockfile);

test('pnpm', async () => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall(), nodeResolve()]
  });

  const json = JSON.parse(readFileSync('package.json', 'utf-8'));
  // snapshots for this are a nightmare cross-platform
  expect('node-noop' in json.dependencies).toBeTruthy();
}, 50000);

afterAll(async () => {
  try {
    expect(
      readFileSync(rootLockfile).equals(originalLockfileContent),
      'the workspace root lockfile was modified by a fixture install'
    ).toBe(true);
  } finally {
    await del(['node_modules', 'package.json']);
    writeFileSync('pnpm-lock.yaml', '');
  }
});
