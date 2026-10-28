const { join } = require('path');

const { rollup, VERSION } = require('rollup');

const { getImports } = require('../../../util/test');
const { nodeResolve } = require('..');

const rollupMajor = Number(VERSION.split('.')[0]);

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
  const [{ exporter, id, importer, source }] = warnings;
  if (rollupMajor >= 3) {
    expect(exporter, 'exporter').toBe('string/uppercase.js');
    expect(id.endsWith('jail.js'), 'id').toBe(true);
  } else {
    // rollup 2 names the unresolved module "source" and the importing module "importer"
    expect(source, 'source').toBe('string/uppercase.js');
    expect(importer, 'importer').toBe('jail.js');
  }
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
