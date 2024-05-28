const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const del = require('..');

const { getCode } = require('../../../util/test');

const output = { dir: 'output', format: 'umd' };

process.chdir(join(__dirname, 'fixtures'));

test.serial('default options', async (t) => {
  const bundle = await rollup({
    input: 'test-file.js',
    plugins: [del({ targets: 'output/*', verbose: true, dryRun: true })]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('runOnce option', async (t) => {
  const bundle = await rollup({
    input: 'test-file.js',
    plugins: [del({ targets: 'output/*', runOnce: true, verbose: true, dryRun: true })]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('verbose option', async (t) => {
  const bundle = await rollup({
    input: 'test-file.js',
    plugins: [del({ targets: 'output/*', verbose: true, dryRun: true })]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('non-existent files', async (t) => {
  const bundle = await rollup({
    input: 'test-file.js',
    plugins: [del({ targets: 'non-existent-file.js', verbose: true, dryRun: true })]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});

test.serial('delete files', async (t) => {
  const bundle = await rollup({
    input: 'test-file.js',
    plugins: [del({ targets: 'output/*', verbose: true })]
  });
  const code = await getCode(bundle, output, true);
  t.snapshot(code);
});
