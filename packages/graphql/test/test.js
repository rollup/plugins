const { rollup } = require('rollup');

const graphql = require('current-package');

const { testBundle } = require('../../../util/test');

require('source-map-support').install();

process.chdir(__dirname);

test('should parse a simple graphql file', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('doc' in module.exports).toBeTruthy();
  expect(module.exports.doc.kind).toBe('Document');
});

test('should include a fragment', async () => {
  const bundle = await rollup({
    input: 'fixtures/fragments/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('doc' in module.exports).toBeTruthy();
  expect(module.exports.doc.kind).toBe('Document');
  expect(module.exports.doc.definitions[1].name.value).toBe('HeroFragment');
});

test('should support multi-imports', async () => {
  const bundle = await rollup({
    input: 'fixtures/multi-imports/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('GetHero' in module.exports).toBeTruthy();
  expect(module.exports.GetHero.kind).toBe('Document');
  expect(module.exports.GetHero.definitions[0].name.value).toBe('GetHero');

  expect('GetHeros' in module.exports).toBeTruthy();
  expect(module.exports.GetHeros.kind).toBe('Document');
  expect(module.exports.GetHeros.definitions[0].name.value).toBe('GetHeros');
});

test('should support graphqls schema files', async () => {
  const bundle = await rollup({
    input: 'fixtures/graphqls/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('doc' in module.exports).toBeTruthy();
  expect(module.exports.doc.kind).toBe('Document');
});

test('should support fragment imports with brackets and parentheses in file paths', async () => {
  const bundle = await rollup({
    input: 'fixtures/fragments-with-special-characters/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('doc' in module.exports).toBeTruthy();
  expect(module.exports.doc.kind).toBe('Document');
});
