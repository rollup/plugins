const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const test = require('ava');
const del = require('del');
const resolve = require('rollup-plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/npm');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');
const manager = 'npm';
const pkgFile = join(cwd, 'package.json');

process.chdir(cwd);

test('invalid manager', (t) => {
  const error = t.throws(
    () =>
      rollup({
        input,
        output: {
          file,
          format: 'cjs'
        },
        plugins: [autoInstall({ pkgFile, manager: 'foo' }), resolve()]
      }),
    RangeError
  );
  t.snapshot(error.message);
});

test('npm', async (t) => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall({ pkgFile, manager }), resolve()]
  });
  t.snapshot(readFileSync('package-lock.json', 'utf-8'));
});

test.after(async () => {
  await del(['node_modules', 'package-lock.json']);
  writeFileSync(pkgFile, '{}');
});
