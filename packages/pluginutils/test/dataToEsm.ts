import test from 'ava';

import { dataToEsm } from '../';

test('outputs treeshakeable data', (t) => {
  t.is(
    dataToEsm({ some: 'data', another: 'data' }),
    'export var some = "data";\nexport var another = "data";\nexport default {\n\tsome: some,\n\tanother: another\n};\n'
  );
});

test('handles illegal identifiers, object shorthand, preferConst', (t) => {
  t.is(
    dataToEsm({ '1': 'data', default: 'data' }, { objectShorthand: true, preferConst: true }),
    'export default {\n\t"1": "data",\n\t"default": "data"\n};\n'
  );
});

test('supports non-JSON data', (t) => {
  const date = new Date();
  t.is(
    dataToEsm({ inf: -Infinity, date, number: NaN, regexp: /.*/ }),
    `export var inf = -Infinity;\nexport var date = new Date(${date.getTime()});\nexport var number = NaN;\nexport var regexp = /.*/;\nexport default {\n\tinf: inf,\n\tdate: date,\n\tnumber: number,\n\tregexp: regexp\n};\n`
  );
});

test('supports a compact argument', (t) => {
  t.is(
    dataToEsm({ some: 'data', another: 'data' }, { compact: true, objectShorthand: true }),
    'export var some="data";export var another="data";export default{some,another};'
  );
  t.is(
    dataToEsm(
      {
        some: { deep: { object: 'definition', here: 'here' } },
        else: { deep: { object: 'definition', here: 'here' } }
      },
      { compact: true, objectShorthand: false }
    ),
    'export var some={deep:{object:"definition",here:"here"}};export default{some:some,"else":{deep:{object:"definition",here:"here"}}};'
  );
});

test('supports nested objects', (t) => {
  const obj = { a: { b: 'c', d: ['e', 'f'] } };
  t.is(
    dataToEsm({ obj }),
    'export var obj = {\n\ta: {\n\t\tb: "c",\n\t\td: [\n\t\t\t"e",\n\t\t\t"f"\n\t\t]\n\t}\n};\nexport default {\n\tobj: obj\n};\n'
  );
});

test('supports nested arrays', (t) => {
  const arr = ['a', 'b'];
  t.is(
    dataToEsm({ arr }),
    'export var arr = [\n\t"a",\n\t"b"\n];\nexport default {\n\tarr: arr\n};\n'
  );
});

test('serializes null', (t) => {
  t.is(dataToEsm({ null: null }), 'export default {\n\t"null": null\n};\n');
});

test('supports default only', (t) => {
  const arr = ['a', 'b'];
  t.is(
    dataToEsm({ arr }, { namedExports: false }),
    'export default {\n\tarr: [\n\t\t"a",\n\t\t"b"\n\t]\n};'
  );
});

test('exports default only for arrays', (t) => {
  const arr = ['a', 'b'];
  t.is(dataToEsm(arr), 'export default [\n\t"a",\n\t"b"\n];');
});

test('exports default only for null', (t) => {
  t.is(dataToEsm(null, { compact: true }), 'export default null;');
});

test('exports default only for primitive values', (t) => {
  t.is(dataToEsm('some string'), 'export default "some string";');
});

test('supports empty keys', (t) => {
  t.is(
    dataToEsm({ a: 'x', '': 'y' }),
    'export var a = "x";\nexport default {\n\ta: a,\n\t"": "y"\n};\n'
  );
});

test('avoid U+2029 U+2029 -0 be ignored by JSON.stringify, and avoid it return non-string (undefined) before replacing', (t) => {
  t.is(
    // eslint-disable-next-line no-undefined, func-names
    dataToEsm([-0, '\u2028\u2029', undefined, function () {}], { compact: true }),
    'export default[-0,"\\u2028\\u2029",undefined,undefined];'
  );
});
