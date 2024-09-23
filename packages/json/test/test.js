const { readFileSync } = require('fs');

const test = require('ava');
const { rollup } = require('rollup');

const { nodeResolve } = require('@rollup/plugin-node-resolve');

const { testBundle } = require('../../../util/test');

const json = require('..'); // eslint-disable-line import/no-unresolved

const read = (file) => readFileSync(file, 'utf-8');

require('source-map-support').install();

process.chdir(__dirname);

test('converts json', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [json()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('handles arrays', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/array/main.js',
    plugins: [json()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('handles literals', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/literal/main.js',
    plugins: [json()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('generates named exports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/named/main.js',
    plugins: [json()]
  });

  const { code, result } = await testBundle(t, bundle, { inject: { exports: {} } });

  t.is(result.version, '1.33.7');
  t.is(code.indexOf('this-should-be-excluded'), -1, 'should exclude unused properties');
});

test('generates named exports including arbitrary names', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/arbitrary/main.js',
    plugins: [json({ includeArbitraryNames: true })]
  });

  const { result } = await testBundle(t, bundle, { inject: { exports: {} } });

  t.is(result.bar, 'baz');
});

test('resolves extensionless imports in conjunction with the node-resolve plugin', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/extensionless/main.js',
    plugins: [nodeResolve({ extensions: ['.js', '.json'] }), json()]
  });
  t.plan(2);
  return testBundle(t, bundle);
});

test('handles JSON objects with no valid keys (#19)', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/no-valid-keys/main.js',
    plugins: [json()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('handles garbage', async (t) => {
  const err = await t.throwsAsync(
    rollup({
      input: 'fixtures/garbage/main.js',
      plugins: [json()]
    })
  );
  t.is(err.code, 'PLUGIN_ERROR');
  t.is(err.plugin, 'json');
  t.is(err.message, 'Could not parse JSON file');
  t.is(err.name, 'RollupError');
  t.is(err.cause.name, 'SyntaxError');
  t.regex(err.id, /(.*)bad.json$/);
});

test('does not generate an AST', async (t) => {
  // eslint-disable-next-line no-undefined
  t.is(json().transform(read('fixtures/form/input.json'), 'input.json').ast, undefined);
});

test('does not generate source maps', async (t) => {
  t.deepEqual(json().transform(read('fixtures/form/input.json'), 'input.json').map, {
    mappings: ''
  });
});

test('generates properly formatted code', async (t) => {
  const { code } = json().transform(read('fixtures/form/input.json'), 'input.json');
  t.snapshot(code);
});

test('generates correct code with preferConst', async (t) => {
  const { code } = json({ preferConst: true }).transform(
    read('fixtures/form/input.json'),
    'input.json'
  );
  t.snapshot(code);
});

test('uses custom indent string', async (t) => {
  const { code } = json({ indent: '  ' }).transform(read('fixtures/form/input.json'), 'input.json');
  t.snapshot(code);
});

test('generates correct code with compact=true', async (t) => {
  const { code } = json({ compact: true }).transform(
    read('fixtures/form/input.json'),
    'input.json'
  );
  t.snapshot(code);
});

test('generates correct code with namedExports=false', async (t) => {
  const { code } = json({ namedExports: false }).transform(
    read('fixtures/form/input.json'),
    'input.json'
  );
  t.snapshot(code);
});

test('correctly formats arrays with compact=true', async (t) => {
  t.deepEqual(
    json({ compact: true }).transform(
      `[
  1,
  {
    "x": 1
  }
]`,
      'input.json'
    ).code,
    'export default[1,{x:1}];'
  );
});

test('handles empty keys', async (t) => {
  t.deepEqual(
    json().transform(`{"":"a", "b": "c"}`, 'input.json').code,
    'export var b = "c";\nexport default {\n\t"": "a",\n\tb: b\n};\n'
  );
});
