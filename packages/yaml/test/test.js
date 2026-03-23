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
