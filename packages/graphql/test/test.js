const test = require('ava');
const { rollup } = require('rollup');

const graphql = require('current-package');

const { testBundle } = require('../../../util/test');

require('source-map-support').install();

process.chdir(__dirname);

test('should parse a simple graphql file', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(t, bundle);

  t.truthy('doc' in module.exports);
  t.is(module.exports.doc.kind, 'Document');
});

test('should include a fragment', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/fragments/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(t, bundle);

  t.truthy('doc' in module.exports);
  t.is(module.exports.doc.kind, 'Document');
  t.is(module.exports.doc.definitions[1].name.value, 'HeroFragment');
});

test('should support multi-imports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/multi-imports/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(t, bundle);

  t.truthy('GetHero' in module.exports);
  t.is(module.exports.GetHero.kind, 'Document');
  t.is(module.exports.GetHero.definitions[0].name.value, 'GetHero');

  t.truthy('GetHeros' in module.exports);
  t.is(module.exports.GetHeros.kind, 'Document');
  t.is(module.exports.GetHeros.definitions[0].name.value, 'GetHeros');
});

test('should support graphqls schema files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/graphqls/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(t, bundle);

  t.truthy('doc' in module.exports);
  t.is(module.exports.doc.kind, 'Document');
});
