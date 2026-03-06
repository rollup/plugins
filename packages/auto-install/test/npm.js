const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const del = require('del');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { rollup } = require('rollup');

const autoInstall = require('..');

const cwd = join(__dirname, 'fixtures/npm');
const file = join(cwd, 'output/bundle.js');
const input = join(cwd, '../input.js');
const manager = 'npm';
const pkgFile = join(cwd, 'package.json');

process.chdir(cwd);

test('invalid manager', () => {
  const error = (() => {
    try {
      rollup({
        input,
        output: {
          file,
          format: 'cjs'
        },
        plugins: [autoInstall({ pkgFile, manager: 'foo' }), nodeResolve()]
      });
    } catch (caught) {
      return caught;
    }

    return null;
  })();

  expect(error).toBeInstanceOf(RangeError);
  expect(error.message).toMatchSnapshot();
}, 50000);

test('npm', async () => {
  await rollup({
    input,
    output: {
      file,
      format: 'cjs'
    },
    plugins: [autoInstall({ pkgFile, manager }), nodeResolve()]
  });
  expect(readFileSync('package.json', 'utf-8')).toMatchSnapshot();
}, 50000);

afterAll(async () => {
  await del(['node_modules', 'package-lock.json']);
  writeFileSync(pkgFile, '{}');
});
