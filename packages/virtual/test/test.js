const path = require('path');

const test = require('ava');

const virtual = require('..');

test('loads a bare module ID from memory', (t) => {
  const plugin = virtual({
    foo: 'export default 42'
  });

  const resolved = plugin.resolveId('foo');

  t.is(resolved, '\0virtual:foo');
  t.is(plugin.load(resolved), 'export default 42');
});

test('loads an absolute path from memory', (t) => {
  const plugin = virtual({
    'src/foo.js': 'export default 42'
  });

  const resolved = plugin.resolveId('./foo.js', 'src/main.js');

  t.is(resolved, `\0virtual:${path.resolve('src/foo.js')}`);
  t.is(plugin.load(resolved), 'export default 42');
});
