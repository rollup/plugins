const rollup = require('rollup');

const { getCode } = require('../../../util/test');

const image = require('..');

process.chdir(__dirname);

test('imports an image', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/image.js',
    plugins: [image()]
  });

  expect(await getCode(bundle)).toMatchSnapshot();
});

test('imports an image for the dom', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/image.js',
    plugins: [image({ dom: true })]
  });

  expect(await getCode(bundle)).toMatchSnapshot();
});

test('ignores invalid image', async () =>
  expect(
    rollup.rollup({
      input: 'fixtures/invalid-image.js',
      plugins: [image()]
    })
  ).rejects.toThrow());

test('imports an svg, encodes for url', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg.js',
    plugins: [image()]
  });

  expect(await getCode(bundle)).toMatchSnapshot();
});

test('imports an svg for dom, encodes for url', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg.js',
    plugins: [image({ dom: true })]
  });

  expect(await getCode(bundle)).toMatchSnapshot();
});

test('loads images imported with import attributes', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/svg-with-type.js',
    plugins: [image({ include: '**/*.svg', exclude: /attributes/ })]
  });

  expect(await getCode(bundle)).toContain('data:image/svg+xml,');
});
