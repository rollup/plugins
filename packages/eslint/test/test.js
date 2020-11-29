const fs = require('fs');

const test = require('ava');
const { rollup } = require('rollup');

const eslint = require('..');

test('runs with the plugin', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/all-good',
    plugins: [eslint()]
  });
  const { output } = await bundle.generate({ file: '' });

  t.true(output[0].code.length > 0);
});

test('autofix works', async (t) => {
  const originalFileContents = fs.readFileSync('test/fixtures/will-fix.js').toString();

  const bundle = await rollup({
    input: 'test/fixtures/will-fix',
    plugins: [eslint({ fix: true })]
  });
  const { output } = await bundle.generate({ file: '' });

  // revert file contents
  fs.writeFileSync('test/fixtures/will-fix.js', originalFileContents);

  t.true(output[0].code.includes('const func'));
});

test('ignores node_modules', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/no-node-modules',
    plugins: [eslint()]
  });
  const { output } = await bundle.generate({ file: '' });

  t.true(output[0].code.length > 0);
});
