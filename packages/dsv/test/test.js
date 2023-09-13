const test = require('ava');
const { rollup } = require('rollup');

const dsv = require('..');

process.chdir(__dirname);

const testBundle = async (t, bundle) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;
  const func = new Function('t', code); // eslint-disable-line no-new-func

  return func(t);
};

test('converts a csv file', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic-csv/main.js',
    plugins: [dsv()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('converts a tsv file', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic-tsv/main.js',
    plugins: [dsv()]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('uses a custom processor', async (t) => {
  const parse = (value) => (isNaN(+value) ? value : +value);

  const bundle = await rollup({
    input: 'fixtures/process/main.js',
    plugins: [
      dsv({
        processRow(row) {
          Object.keys(row).forEach((key) => {
            row[key] = parse(row[key]); // eslint-disable-line no-param-reassign
          });
        }
      })
    ]
  });
  t.plan(1);
  return testBundle(t, bundle);
});

test('uses a custom processor with id', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/process-id/main.js',
    plugins: [
      dsv({
        processRow(row, id) {
          return {
            type: row.type[/lower/.test(id) ? 'toLowerCase' : 'toUpperCase'](),
            count: +row.count
          };
        }
      })
    ]
  });
  t.plan(2);
  return testBundle(t, bundle);
});
