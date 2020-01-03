const test = require('ava');
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const yamlParser = require('js-yaml');

const { testBundle } = require('../../../util/test');

const spec = require('./fixtures/spec.json');

const yaml = require('..');

require('source-map-support').install();

process.chdir(__dirname);

// Tests YAML spec conformance from https://github.com/connec/yaml-spec/blob/master/spec.json
// Just making sure the underlying YAML parser isn't crap
Object.keys(spec).forEach((key, keyIndex) => {
  Object.keys(spec[key]).forEach((testKey, testIndex) => {
    const fixture = spec[key][testKey];

    test(`converts YAML spec ${keyIndex}:${testIndex}`, (t) => {
      const result = yamlParser.load(fixture.yaml);
      t.deepEqual(result, fixture.result);
    });
  });
});

test('converts yaml', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/basic/main.js',
    plugins: [yaml()]
  });
  return testBundle(t, bundle);
});

test('converts yml', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/yml/main.js',
    plugins: [yaml()]
  });
  return testBundle(t, bundle);
});

test('generates named exports', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/named/main.js',
    plugins: [yaml()]
  });
  return testBundle(t, bundle);
});

test('resolves extensionless imports in conjunction with nodeResolve plugin', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/extensionless/main.js',
    plugins: [nodeResolve({ extensions: ['.js', '.yaml'] }), yaml()]
  });
  return testBundle(t, bundle);
});

test('applies the optional transform method to parsed YAML', async (t) => {
  const transform = (data) => {
    if (Array.isArray(data)) {
      return data.filter((datum) => !datum.private);
    }
    Object.keys(data).forEach((key) => {
      if (data[key].private) {
        delete data[key]; // eslint-disable-line no-param-reassign
      }
    });
    return undefined; // eslint-disable-line no-undefined
  };

  const bundle = await rollup.rollup({
    input: 'fixtures/transform/main.js',
    plugins: [yaml({ transform })]
  });
  return testBundle(t, bundle);
});

test('documentMode: multi', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/multi/main.js',
    plugins: [yaml({ documentMode: 'multi' })]
  });
  return testBundle(t, bundle);
});

test('documentMode: multi, safe', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/multi/main.js',
    plugins: [yaml({ documentMode: 'multi', safe: false })]
  });
  return testBundle(t, bundle);
});

test('converts yaml, safe', async (t) => {
  const bundle = await rollup.rollup({
    input: 'fixtures/basic/main.js',
    plugins: [yaml({ safe: false })]
  });
  return testBundle(t, bundle);
});

test('bad documentMode', async (t) => {
  const exec = () =>
    rollup.rollup({
      input: 'fixtures/basic/main.js',
      plugins: [yaml({ documentMode: true })]
    });

  t.throws(exec);
});
