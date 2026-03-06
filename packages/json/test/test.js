const { readFileSync } = require('fs');

const { rollup } = require('rollup');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

const { testBundle } = require('../../../util/test');
const json = require('..');
// eslint-disable-line import/no-unresolved
const avaAssertions = {
  is(actual, expected) {
    expect(actual).toBe(expected);
  },
  deepEqual(actual, expected) {
    expect(actual).toEqual(expected);
  }
};

const read = (file) => readFileSync(file, 'utf-8');
require('source-map-support').install();

process.chdir(__dirname);
test('converts json', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [json()]
  });
  expect.assertions(1);
  return testBundle(avaAssertions, bundle);
});
test('handles arrays', async () => {
  const bundle = await rollup({
    input: 'fixtures/array/main.js',
    plugins: [json()]
  });
  expect.assertions(1);
  return testBundle(avaAssertions, bundle);
});
test('handles literals', async () => {
  const bundle = await rollup({
    input: 'fixtures/literal/main.js',
    plugins: [json()]
  });
  expect.assertions(1);
  return testBundle(avaAssertions, bundle);
});
test('generates named exports', async () => {
  const bundle = await rollup({
    input: 'fixtures/named/main.js',
    plugins: [json()]
  });
  const { code, result } = await testBundle(avaAssertions, bundle, {
    inject: {
      exports: {}
    }
  });
  expect(result.version).toBe('1.33.7');
  expect(code.indexOf('this-should-be-excluded')).toBe(-1);
});
test('generates named exports including arbitrary names', async () => {
  const bundle = await rollup({
    input: 'fixtures/arbitrary/main.js',
    plugins: [
      json({
        includeArbitraryNames: true
      })
    ]
  });
  const { result } = await testBundle(avaAssertions, bundle, {
    inject: {
      exports: {}
    }
  });
  expect(result.bar).toBe('baz');
});
test('resolves extensionless imports in conjunction with the node-resolve plugin', async () => {
  const bundle = await rollup({
    input: 'fixtures/extensionless/main.js',
    plugins: [
      nodeResolve({
        extensions: ['.js', '.json']
      }),
      json()
    ]
  });
  expect.assertions(2);
  return testBundle(avaAssertions, bundle);
});
test('handles JSON objects with no valid keys (#19)', async () => {
  const bundle = await rollup({
    input: 'fixtures/no-valid-keys/main.js',
    plugins: [json()]
  });
  expect.assertions(1);
  return testBundle(avaAssertions, bundle);
});
test('handles garbage', async () => {
  const err = await rollup({
    input: 'fixtures/garbage/main.js',
    plugins: [json()]
  }).catch((error) => error);
  expect(err.code).toBe('PLUGIN_ERROR');
  expect(err.plugin).toBe('json');
  expect(err.message).toBe('Could not parse JSON file');
  expect(err.name).toBe('RollupError');
  expect(err.cause.name).toBe('SyntaxError');
  expect(err.id).toMatch(/(.*)bad.json$/);
});
test('does not generate an AST', async () => {
  // eslint-disable-next-line no-undefined
  expect(json().transform(read('fixtures/form/input.json'), 'input.json').ast).toBe(undefined);
});
test('does not generate source maps', async () => {
  expect(json().transform(read('fixtures/form/input.json'), 'input.json').map).toEqual({
    mappings: ''
  });
});
test('generates properly formatted code', async () => {
  const { code } = json().transform(read('fixtures/form/input.json'), 'input.json');
  expect(code).toMatchSnapshot();
});
test('generates correct code with preferConst', async () => {
  const { code } = json({
    preferConst: true
  }).transform(read('fixtures/form/input.json'), 'input.json');
  expect(code).toMatchSnapshot();
});
test('uses custom indent string', async () => {
  const { code } = json({
    indent: '  '
  }).transform(read('fixtures/form/input.json'), 'input.json');
  expect(code).toMatchSnapshot();
});
test('generates correct code with compact=true', async () => {
  const { code } = json({
    compact: true
  }).transform(read('fixtures/form/input.json'), 'input.json');
  expect(code).toMatchSnapshot();
});
test('generates correct code with namedExports=false', async () => {
  const { code } = json({
    namedExports: false
  }).transform(read('fixtures/form/input.json'), 'input.json');
  expect(code).toMatchSnapshot();
});
test('correctly formats arrays with compact=true', async () => {
  expect(
    json({
      compact: true
    }).transform(
      `[
  1,
  {
    "x": 1
  }
]`,
      'input.json'
    ).code
  ).toEqual('export default[1,{x:1}];');
});
test('handles empty keys', async () => {
  expect(json().transform(`{"":"a", "b": "c"}`, 'input.json').code).toEqual(
    'export var b = "c";\nexport default {\n\t"": "a",\n\tb: b\n};\n'
  );
});
