const fs = require('fs');

const test = require('ava');
const { rollup } = require('rollup');

const eslint = require('..');

test('runs with the plugin', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/all-good',
    plugins: [eslint()]
  });
  const { output } = await bundle.generate({});
  const [{ code }] = output;

  t.true(code.length > 0);
});

test('autofix works', async (t) => {
  const originalFileContents = fs.readFileSync('test/fixtures/will-fix.js').toString();

  const bundle = await rollup({
    input: 'test/fixtures/will-fix',
    plugins: [eslint({ fix: true })]
  });
  const { output } = await bundle.generate({});
  const [{ code }] = output;

  // revert file contents
  fs.writeFileSync('test/fixtures/will-fix.js', originalFileContents);

  t.true(code.includes('const func'));
});
