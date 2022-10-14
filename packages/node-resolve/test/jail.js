const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { getImports } = require('../../../util/test');

const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('mark module outside the jail as external', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'jail.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        // changed to /fixtures above
        jail: join(__dirname, 'snapshots')
      })
    ]
  });
  const imports = await getImports(bundle);
  t.deepEqual(imports, ['string/uppercase.js']);

  t.is(warnings.length, 1, 'number of warnings');
  const [{ exporter, id }] = warnings;
  t.is(exporter, 'string/uppercase.js', 'exporter');
  t.is(id.endsWith('jail.js'), true, 'id');
});

test('bundle module defined inside the jail', async (t) => {
  const bundle = await rollup({
    input: 'jail.js',
    onwarn: () => t.fail('No warnings were expected'),
    plugins: [
      nodeResolve({
        jail: `${__dirname}/`
      })
    ]
  });
  const imports = await getImports(bundle);

  t.deepEqual(imports, []);
});
