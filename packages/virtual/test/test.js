const path = require('path');

const { rollup } = require('rollup');

const virtual = require('..');

test('loads a bare module ID from memory', () => {
  const plugin = virtual({
    foo: 'export default 42'
  });

  const resolved = plugin.resolveId('foo');

  expect(resolved).toBe('\0virtual:foo');
  expect(plugin.load(resolved)).toBe('export default 42');
});

test('loads an absolute path from memory', () => {
  const plugin = virtual({
    'src/foo.js': 'export default 42'
  });

  const resolved = plugin.resolveId('./foo.js', 'src/main.js');

  expect(resolved).toBe(`\0virtual:${path.resolve('src/foo.js')}`);
  expect(plugin.load(resolved)).toBe('export default 42');
});

test('bundles virtual modules imported with import attributes', async () => {
  const bundle = await rollup({
    input: 'entry',
    plugins: [
      virtual({
        entry:
          "import a from 'foo' with { type: 'virtual' }; import b from './src/main.js' with { foo: 'bar' }; export default [a, b];",
        foo: 'export default 42',
        'src/main.js': "import value from './foo.js' with { bar: 'baz' }; export default value;",
        'src/foo.js': 'export default 99'
      })
    ]
  });

  const { output } = await bundle.generate({ format: 'es' });
  expect(output[0].code).toContain('42');
  expect(output[0].code).toContain('99');
});
