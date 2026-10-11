const rollup = require('rollup');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const yamlParser = require('js-yaml');

const { testBundle } = require('../../../util/test');

const yaml = require('..');

const spec = require('./fixtures/spec.json');

require('source-map-support').install();

process.chdir(__dirname);

// Tests YAML spec conformance from https://github.com/connec/yaml-spec/blob/master/spec.json
// Just making sure the underlying YAML parser isn't crap
Object.keys(spec).forEach((key, keyIndex) => {
  Object.keys(spec[key]).forEach((testKey, testIndex) => {
    const fixture = spec[key][testKey];

    test(`converts YAML spec ${keyIndex}:${testIndex}`, () => {
      const result = yamlParser.load(fixture.yaml);
      expect(result).toEqual(fixture.result);
    });
  });
});

test('converts yaml', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/basic/main.js',
    plugins: [yaml()]
  });
  return testBundle(undefined, bundle);
});

test('converts yml', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/yml/main.js',
    plugins: [yaml()]
  });
  return testBundle(undefined, bundle);
});

test('generates named exports', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/named/main.js',
    plugins: [yaml()]
  });
  return testBundle(undefined, bundle);
});

test('preserves quoted numeric mapping keys in an ES module', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/numeric-keys/main.js',
    plugins: [yaml()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output[0].code).toContain('export');
  const { error, module } = await testBundle(undefined, bundle);
  expect(error).toBeUndefined();
  expect(module.exports).toEqual({
    '00': 'zeroes',
    '01': 'leading zero',
    '08': 'eight',
    '9007199254740993': 'large integer',
    nested: { '01': 'nested leading zero' }
  });
});

test('preserves YAML timestamps, non-finite numbers and aliases', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/serialized-values/main.js',
    plugins: [yaml()]
  });
  const { error, module } = await testBundle(undefined, bundle, {
    options: { exports: 'named' }
  });
  expect(error).toBeUndefined();
  const data = module.exports.default;
  expect(data.timestamp).toEqual(new Date('2020-01-02T03:04:05.000Z'));
  expect(data.values).toEqual([Infinity, -Infinity, NaN, -0]);
  expect(data.shared).toEqual({ '01': 'alias value' });
  expect(data.alias).toEqual(data.shared);
  expect(module.exports.shared).toBe(data.shared);
  expect(data.loop.self).toEqual({ $circularReference: 1 });
});

test('preserves special values returned by a transform', async () => {
  const data = {
    regexp: /example/gi,
    map: new Map([['key', 'value']]),
    set: new Set(['value']),
    fn: function value() {
      return 42;
    }
  };
  const bundle = await rollup.rollup({
    input: 'fixtures/numeric-keys/main.js',
    plugins: [yaml({ transform: () => data })]
  });
  const { error, module } = await testBundle(undefined, bundle);
  expect(error).toBeUndefined();
  expect(module.exports.regexp).toEqual(data.regexp);
  expect(module.exports.map).toEqual(data.map);
  expect(module.exports.set).toEqual(data.set);
  expect(module.exports.fn()).toBe(42);
});

test('resolves extensionless imports in conjunction with nodeResolve plugin', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/extensionless/main.js',
    plugins: [nodeResolve({ extensions: ['.js', '.yaml'] }), yaml()]
  });
  return testBundle(undefined, bundle);
});

test('applies the optional transform method to parsed YAML', async () => {
  const transform = (data, filePath) => {
    // check that transformer is passed a correct file path
    expect(typeof filePath === 'string' && filePath.endsWith('.yaml')).toBe(true);
    if (Array.isArray(data)) {
      expect(filePath.endsWith('array.yaml')).toBe(true);
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
  return testBundle(undefined, bundle);
});

test('documentMode: multi', async () => {
  const bundle = await rollup.rollup({
    input: 'fixtures/multi/main.js',
    plugins: [yaml({ documentMode: 'multi' })]
  });
  return testBundle(undefined, bundle);
});

test('bad documentMode', async () => {
  const exec = () =>
    rollup.rollup({
      input: 'fixtures/basic/main.js',
      plugins: [yaml({ documentMode: true })]
    });

  expect(exec).toThrow();
});

test('file extension not in the list', async () => {
  const content = 'some content';
  const id = 'testfile.unknown';
  const plugin = yaml();
  const output = plugin.transform.handler(content, id);

  expect(output).toBeNull();
});

test('file passes the filter', async () => {
  const content = 'some content';
  const id = 'testfile.yaml';
  const plugin = yaml({ include: '**/*.yaml' });
  const output = plugin.transform.handler(content, id);

  expect(output).not.toBeNull();
});

test('file does not pass the filter', async () => {
  const content = 'some content';
  const id = 'testfile.yaml';
  const plugin = yaml({ exclude: '**/*.yaml' });
  const output = plugin.transform.handler(content, id);

  expect(output).toBeNull();
});

test('uses custom extensions', async () => {
  const content = 'some content';
  const id = 'testfile.custom';
  const plugin = yaml({ extensions: ['.custom'] });
  const output = plugin.transform.handler(content, id);

  expect(output).not.toBeNull();
});

test('does not process non-custom extensions', async () => {
  const content = 'some content';
  const id = 'testfile.yaml';
  const plugin = yaml({ extensions: ['.custom'] });
  const output = plugin.transform.handler(content, id);

  expect(output).toBeNull();
});
