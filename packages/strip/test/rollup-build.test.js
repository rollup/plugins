const { rollup } = require('rollup');

const strip = require('..');

const ENTRY_ID = 'entry.js';
const ENTRY_CODE = [
  'debugger;',
  "console.log('stripped-sentinel');",
  "export default 'kept-sentinel';"
].join('\n');

const entryPlugin = {
  name: 'entry',
  resolveId(id) {
    if (id === ENTRY_ID) return ENTRY_ID;
    return null;
  },
  load(id) {
    if (id === ENTRY_ID) return ENTRY_CODE;
    return null;
  }
};

test('strips debugger and console calls in a real build', async () => {
  const bundle = await rollup({
    input: ENTRY_ID,
    plugins: [entryPlugin, strip()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  expect(output).toHaveLength(1);
  const [{ code }] = output;
  expect(code).toContain('kept-sentinel');
  expect(code).not.toContain('stripped-sentinel');
  expect(code).not.toContain('debugger');
});
