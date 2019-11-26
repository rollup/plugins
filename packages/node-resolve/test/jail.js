const { join } = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { getImports } = require('../../../util/test');

const nodeResolve = require('..');

process.chdir(join(__dirname, 'fixtures'));

test('mark as external to module outside the jail', async (t) => {
  const warnings = [];
  const bundle = await rollup({
    input: 'jail.js',
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        // changed to /fixtures above
        jail: process.cwd()
      })
    ]
  });
  const imports = await getImports(bundle);

  t.snapshot(warnings);
  t.is(warnings.length, 1);
  t.deepEqual(imports, ['string/uppercase.js']);
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
