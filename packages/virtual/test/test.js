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

test('from memory input entry options are prefixed immediately', (t) => {
  const plugin = virtual({
    'foo.js': 'export default 42',
    'src/foo.js': 'export default 42'
  });

  const singleInputOption = {
    input: 'foo.js'
  };

  const multipleInputOption = {
    input: ['foo.js', 'src/foo.js']
  };

  const mappedInputOption = {
    input: {
      'foo.js': 'lib/foo.js',
      'src/foo.js': 'lib/index.js'
    }
  };

  t.is(plugin.options(singleInputOption).input, '\0virtual:foo.js');
  t.deepEqual(plugin.options(multipleInputOption).input, [
    '\0virtual:foo.js',
    '\0virtual:src/foo.js'
  ]);
  t.deepEqual(plugin.options(mappedInputOption).input, {
    '\0virtual:foo.js': 'lib/foo.js',
    '\0virtual:src/foo.js': 'lib/index.js'
  });
});
