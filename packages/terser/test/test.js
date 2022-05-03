const test = require('ava');
const { rollup } = require('rollup');

const { getCode } = require('../../../util/test');

const terser = require('..');

process.chdir(__dirname);

test('minifies javascript', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/simple.js',
    plugins: [terser()]
  });

  t.snapshot(await getCode(bundle));
});

test('passes options to Terser', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/simple.js',
    plugins: [
      terser({
        format: {
          max_line_len: 20
        }
      })
    ]
  });

  t.snapshot(await getCode(bundle));
});

test('fails minification of malformed code', async (t) => {
  await t.throwsAsync(
    rollup({
      input: 'fixtures/error.txt',
      plugins: [terser()]
    })
  );
});

test('minifies without sourcemap', async (t) => {
  const bundle = await rollup({ input: 'fixtures/simple.js' });

  const {
    output: [{ map }]
  } = await bundle.generate({
    plugins: [terser()],
    sourcemap: false
  });

  t.is(map, null);
});

test('minifies with sourcemap', async (t) => {
  const bundle = await rollup({ input: 'fixtures/simple.js' });

  const {
    output: [{ map }]
  } = await bundle.generate({
    plugins: [terser()],
    sourcemap: true
  });

  t.not(map, null);
});

test('emits esm', async (t) => {
  const bundle = await rollup({ input: 'fixtures/simple.js' });

  const {
    output: [{ code }]
  } = await bundle.generate({
    plugins: [terser()],
    format: 'esm'
  });

  t.snapshot(code);
});
