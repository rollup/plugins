const { join } = require('path');

const { rollup } = require('rollup');

const { getImports } = require('../../../util/test');
const { nodeResolve } = require('..');

process.chdir(join(__dirname, 'fixtures'));
test('mark module outside the jail as external', async () => {
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
  expect(imports).toEqual(['string/uppercase.js']);
  expect(warnings.length, 'number of warnings').toBe(1);
  const [{ exporter, id }] = warnings;
  expect(exporter, 'exporter').toBe('string/uppercase.js');
  expect(id.endsWith('jail.js'), 'id').toBe(true);
});
test('bundle module defined inside the jail', async () => {
  const bundle = await rollup({
    input: 'jail.js',
    onwarn: () => expect.unreachable('No warnings were expected'),
    plugins: [
      nodeResolve({
        jail: `${__dirname}/`
      })
    ]
  });
  const imports = await getImports(bundle);
  expect(imports).toEqual([]);
});
