import { dataToEsm } from '../';

test('support bigint', () => {
  expect(dataToEsm({ positive: BigInt('0'), negative: BigInt('-1') })).toBe(
    'export var positive = 0n;\nexport var negative = -1n;\nexport default {\n\tpositive: positive,\n\tnegative: negative\n};\n'
  );
});

test('support symbol', () => {
  expect(dataToEsm({ normal: Symbol.for('key'), empty: Symbol.for('') })).toBe(
    'export var normal = Symbol.for("key");\nexport var empty = Symbol.for("");\nexport default {\n\tnormal: normal,\n\tempty: empty\n};\n'
  );
});

test('outputs treeshakeable data', () => {
  expect(dataToEsm({ some: 'data', another: 'data' })).toBe(
    'export var some = "data";\nexport var another = "data";\nexport default {\n\tsome: some,\n\tanother: another\n};\n'
  );
});

test('handles illegal identifiers, object shorthand, preferConst', () => {
  expect(
    dataToEsm({ '1': 'data', default: 'data' }, { objectShorthand: true, preferConst: true })
  ).toBe('export default {\n\t"1": "data",\n\t"default": "data"\n};\n');
});

test('supports non-JSON data', () => {
  const date = new Date();
  expect(dataToEsm({ inf: -Infinity, date, number: NaN, regexp: /.*/ })).toBe(
    `export var inf = -Infinity;\nexport var date = new Date(${date.getTime()});\nexport var number = NaN;\nexport var regexp = /.*/;\nexport default {\n\tinf: inf,\n\tdate: date,\n\tnumber: number,\n\tregexp: regexp\n};\n`
  );
});

test('supports a compact argument', () => {
  expect(
    dataToEsm({ some: 'data', another: 'data' }, { compact: true, objectShorthand: true })
  ).toBe('export var some="data";export var another="data";export default{some,another};');
  expect(
    dataToEsm(
      {
        some: { deep: { object: 'definition', here: 'here' } },
        else: { deep: { object: 'definition', here: 'here' } }
      },
      { compact: true, objectShorthand: false }
    )
  ).toBe(
    'export var some={deep:{object:"definition",here:"here"}};export default{some:some,"else":{deep:{object:"definition",here:"here"}}};'
  );
});

test('supports nested objects', () => {
  const obj = { a: { b: 'c', d: ['e', 'f'] } };
  expect(dataToEsm({ obj })).toBe(
    'export var obj = {\n\ta: {\n\t\tb: "c",\n\t\td: [\n\t\t\t"e",\n\t\t\t"f"\n\t\t]\n\t}\n};\nexport default {\n\tobj: obj\n};\n'
  );
});

test('supports nested arrays', () => {
  const arr = ['a', 'b'];
  expect(dataToEsm({ arr })).toBe(
    'export var arr = [\n\t"a",\n\t"b"\n];\nexport default {\n\tarr: arr\n};\n'
  );
});

test('serializes null', () => {
  expect(dataToEsm({ null: null })).toBe('export default {\n\t"null": null\n};\n');
});

test('supports default only', () => {
  const arr = ['a', 'b'];
  expect(dataToEsm({ arr }, { namedExports: false })).toBe(
    'export default {\n\tarr: [\n\t\t"a",\n\t\t"b"\n\t]\n};'
  );
});

test('exports default only for arrays', () => {
  const arr = ['a', 'b'];
  expect(dataToEsm(arr)).toBe('export default [\n\t"a",\n\t"b"\n];');
});

test('exports default only for null', () => {
  expect(dataToEsm(null, { compact: true })).toBe('export default null;');
});

test('exports default only for primitive values', () => {
  expect(dataToEsm('some string')).toBe('export default "some string";');
});

test('supports empty keys', () => {
  expect(dataToEsm({ a: 'x', '': 'y' })).toBe(
    'export var a = "x";\nexport default {\n\ta: a,\n\t"": "y"\n};\n'
  );
});

test('avoid U+2029 U+2029 -0 be ignored by JSON.stringify, and avoid it return non-string (undefined) before replacing', () => {
  expect(dataToEsm([-0, '\u2028\u2029', undefined, function () {}], { compact: true })).toBe(
    'export default[-0,"\\u2028\\u2029",undefined,undefined];'
  );
});

test('support arbitrary module namespace identifier names', () => {
  expect(
    dataToEsm(
      { foo: 'foo', 'foo.bar': 'foo.bar', '\udfff': 'non wellformed' },
      { namedExports: true, includeArbitraryNames: true }
    )
  ).toBe(
    'export var foo = "foo";\nvar _arbitrary0 = "foo.bar";\nexport {\n\t_arbitrary0 as "foo.bar"\n};\nexport default {\n\tfoo: foo,\n\t"foo.bar": "foo.bar",\n\t"\\udfff": "non wellformed"\n};\n'
  );
  expect(
    dataToEsm(
      { foo: 'foo', 'foo.bar': 'foo.bar', '\udfff': 'non wellformed' },
      { namedExports: true, includeArbitraryNames: true, compact: true }
    )
  ).toBe(
    'export var foo="foo";var _arbitrary0="foo.bar";export{_arbitrary0 as "foo.bar"};export default{foo:foo,"foo.bar":"foo.bar","\\udfff":"non wellformed"};'
  );
});
