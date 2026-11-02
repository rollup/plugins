const { rollup } = require('rollup');

const virtual = require('..');

test('bundles virtual modules with rollup', async () => {
  const bundle = await rollup({
    input: 'entry',
    plugins: [
      virtual({
        entry: "import value from './dep.js'; export default value;",
        'dep.js': 'export default "virtual-test-value";'
      })
    ]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toHaveLength(1);
  expect(output[0].code).toContain('virtual-test-value');
});
