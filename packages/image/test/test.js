const test = require('ava');
const rollup = require('rollup');

const { getCode } = require('../../../util/test');

const image = require('..');

process.chdir(__dirname);

test('imports an image', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/image.js',
    plugins: [image()]
  });

  t.snapshot(await getCode(bundle));
});

test('imports an image for the dom', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/image.js',
    plugins: [image({ dom: true })]
  });

  t.snapshot(await getCode(bundle));
});

test('ignores invalid image', async (t) =>
  t.throwsAsync(async () =>
    rollup.rollup({
      input: 'fixtures/invalid-image.js',
      plugins: [image()]
    })
  ));
