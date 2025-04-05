const path = require('path');

const test = require('ava');
const { rollup } = require('rollup');

const { commonjs } = require('./helpers/util.js');

process.chdir(path.join(__dirname, 'fixtures/samples/dynamic-require-root-outside-cwd/cwd'));

test('crawls dynamicRequireRoot outside cwd', async (t) => {
  const build = await rollup({
    input: 'main.js',
    plugins: [
      commonjs({
        dynamicRequireRoot: '..',
        dynamicRequireTargets: ['../outer.js']
      })
    ]
  });
  const bundle = await build.generate({ format: 'cjs' });
  const { code } = bundle.output[0];
  t.true(code.includes('outer_export_value'), 'outer_export_value not found in the code');
});
