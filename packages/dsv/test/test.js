const { rollup } = require('rollup');

const dsv = require('..');

process.chdir(__dirname);

const testBundle = async (bundle) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;
  const func = new Function(code); // eslint-disable-line no-new-func

  return func();
};

test('converts a csv file', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic-csv/main.js',
    plugins: [dsv()]
  });
  return testBundle(bundle);
});

test('converts a csv file with bom', async () => {
  const bundle = await rollup({
    input: 'fixtures/csv-with-bom/main.js',
    plugins: [dsv()]
  });
  return testBundle(bundle);
});

test('converts a tsv file', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic-tsv/main.js',
    plugins: [dsv()]
  });
  return testBundle(bundle);
});

test('converts a tsv file with bom', async () => {
  const bundle = await rollup({
    input: 'fixtures/tsv-with-bom/main.js',
    plugins: [dsv()]
  });
  return testBundle(bundle);
});

test('uses a custom processor', async () => {
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
  return testBundle(bundle);
});

test('uses a custom processor with id', async () => {
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
  return testBundle(bundle);
});
