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

test('imports an svg without encoding', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg.js',
    plugins: [image()]
  });

  t.snapshot(await getCode(bundle));
});

test('imports an svg and inline to string', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg.js',
    plugins: [image({ inline: true })]
  });

  t.snapshot(await getCode(bundle));
});

test('imports an svg and inline to dom', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg.js',
    plugins: [image({ dom: true, inline: true })]
  });

  t.snapshot(await getCode(bundle));
});
