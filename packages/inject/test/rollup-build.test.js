const { rollup } = require('rollup');

const inject = require('..');

const modules = {
  'entry.js': 'export default $;',
  'injected.js': "export default 'inject-sentinel-value';"
};

const modulesPlugin = {
  name: 'modules',
  resolveId: (id) => (id in modules ? id : null),
  load: (id) => (id in modules ? modules[id] : null)
};

test('injects imports in a real build', async () => {
  const bundle = await rollup({
    input: 'entry.js',
    plugins: [modulesPlugin, inject({ $: 'injected.js' })]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toHaveLength(1);
  expect(output[0].code).toContain('inject-sentinel-value');
});
