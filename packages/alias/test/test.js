import path, { posix } from 'path';

import test from 'ava';
import { rollup } from 'rollup';
import slash from 'slash';

// eslint-disable-next-line import/no-unresolved, import/extensions
import alias from '../dist';

const normalizePath = (pathToNormalize) => slash(pathToNormalize.replace(/^([A-Z]:)/, ''));
const DIRNAME = normalizePath(__dirname);

test('type', (t) => {
  t.is(typeof alias, 'function');
});

test('instance', (t) => {
  const result = alias();
  t.is(typeof result, 'object');
  t.is(typeof result.resolveId, 'function');
});

test('defaults', (t) => {
  const result = alias({});
  t.is(typeof result, 'object');
  t.is(typeof result.resolveId, 'function');
});

test('Simple aliasing (array)', (t) => {
  const result = alias({
    entries: [
      { find: 'foo', replacement: 'bar' },
      { find: 'pony', replacement: 'paradise' },
      { find: './local', replacement: 'global' }
    ]
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('pony', '/src/importer.js');
  const resolved3 = result.resolveId('./local', '/src/importer.js');

  t.is(resolved, 'bar');
  t.is(resolved2, 'paradise');
  t.is(resolved3, 'global');
});

test('Simple aliasing (object)', (t) => {
  const result = alias({
    entries: {
      foo: 'bar',
      pony: 'paradise',
      './local': 'global'
    }
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('pony', '/src/importer.js');
  const resolved3 = result.resolveId('./local', '/src/importer.js');

  t.is(resolved, 'bar');
  t.is(resolved2, 'paradise');
  t.is(resolved3, 'global');
});

test('RegExp aliasing', (t) => {
  const result = alias({
    entries: [
      { find: /f(o+)bar/, replacement: 'f$1bar2019' },
      { find: new RegExp('.*pony.*'), replacement: 'i/am/a/barbie/girl' },
      { find: /^test\/$/, replacement: 'this/is/strict' }
    ]
  });

  const resolved = result.resolveId('fooooooooobar', '/src/importer.js');
  const resolved2 = result.resolveId('im/a/little/pony/yes', '/src/importer.js');
  const resolved3 = result.resolveId('./test', '/src/importer.js');
  const resolved4 = result.resolveId('test', '/src/importer.js');
  const resolved5 = result.resolveId('test/', '/src/importer.js');

  t.is(resolved, 'fooooooooobar2019');
  t.is(resolved2, 'i/am/a/barbie/girl');
  t.is(resolved3, null);
  t.is(resolved4, null);
  t.is(resolved5, 'this/is/strict');
});

test('Will not confuse modules with similar names', (t) => {
  const result = alias({
    entries: [{ find: 'foo', replacement: 'bar' }, { find: './foo', replacement: 'bar' }]
  });

  const resolved = result.resolveId('foo2', '/src/importer.js');
  const resolved2 = result.resolveId('./fooze/bar', '/src/importer.js');
  const resolved3 = result.resolveId('./someFile.foo', '/src/importer.js');

  t.is(resolved, null);
  t.is(resolved2, null);
  t.is(resolved3, null);
});

test('Local aliasing', (t) => {
  const result = alias({
    entries: [{ find: 'foo', replacement: './bar' }, { find: 'pony', replacement: './par/a/di/se' }]
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
  const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
  const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');

  t.is(resolved, '/src/bar.js');
  t.is(resolved2, '/src/bar/baz.js');
  t.is(resolved3, '/src/bar/baz.js');
  t.is(resolved4, '/src/highly/nested/par/a/di/se.js');
});

test('Absolute local aliasing', (t) => {
  const result = alias({
    entries: [
      { find: 'foo', replacement: '/bar' },
      { find: 'pony', replacement: '/par/a/di/se.js' }
    ]
  });

  const resolved = result.resolveId('foo', '/src/importer.js');
  const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
  const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
  const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');

  t.is(resolved, '/bar.js');
  t.is(resolved2, '/bar/baz.js');
  t.is(resolved3, '/bar/baz.js');
  t.is(resolved4, '/par/a/di/se.js');
});

test('Leaves entry file untouched if matches alias', (t) => {
  const result = alias({
    entries: [{ find: 'abacaxi', replacement: './abacaxi' }]
  });

  // eslint-disable-next-line no-undefined
  const resolved = result.resolveId('abacaxi/entry.js', undefined);

  t.is(resolved, null);
});

test('Test for the resolve property', (t) => {
  const result = alias({
    resolve: ['.js', '.jsx'],
    entries: [{ find: 'ember', replacement: './folder/hipster' }]
  });

  const resolved = result.resolveId('ember', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(resolved, posix.resolve(DIRNAME, './fixtures/folder/hipster.jsx'));
});

test('i/am/a/file', (t) => {
  const result = alias({
    entries: [{ find: 'resolve', replacement: 'i/am/a/file' }]
  });

  const resolved = result.resolveId('resolve', '/src/import.js');

  t.is(resolved, 'i/am/a/file');
});

test('i/am/a/local/file', (t) => {
  const result = alias({
    entries: [{ find: 'resolve', replacement: './i/am/a/local/file' }]
  });

  const resolved = result.resolveId('resolve', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(resolved, posix.resolve(DIRNAME, './fixtures/i/am/a/local/file.js'));
});

test("Platform path.resolve('file-without-extension') aliasing", (t) => {
  // this what used in React and Vue
  const result = alias({
    entries: [{ find: 'test', replacement: path.resolve('./test/fixtures/aliasMe') }]
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(resolved, path.resolve('./test/fixtures/aliasMe.js'));
});

test("Platform path.resolve('just-a-folder') aliasing", (t) => {
  // this what used in RSvelte
  const result = alias({
    resolve: ['.svelte', '.js'],
    entries: [{ find: 'test', replacement: path.resolve('./test/fixtures/Svelte') }]
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(resolved, path.resolve('./test/fixtures/Svelte/index.svelte'));
});

test('Windows absolute path aliasing', (t) => {
  const result = alias({
    entries: [{ find: 'resolve', replacement: 'E:\\react\\node_modules\\fbjs\\lib\\warning' }]
  });

  const resolved = result.resolveId('resolve', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(normalizePath(resolved), normalizePath('E:\\react\\node_modules\\fbjs\\lib\\warning.js'));
});

test("Platform path.resolve('file-with.ext') aliasing", (t) => {
  const result = alias({
    entries: [{ find: 'test', replacement: path.resolve('./test/fixtures/folder/hipster.jsx') }],
    resolve: ['.js', '.jsx']
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './fixtures/index.js'));

  t.is(resolved, path.resolve('./test/fixtures/folder/hipster.jsx'));
});

const getModuleIdsFromBundle = (bundle) => {
  if (bundle.modules) {
    return Promise.resolve(bundle.modules.map((module) => module.id));
  }
  return bundle
    .generate({ format: 'esm' })
    .then((generated) => {
      if (generated.output) {
        return generated.output.length
          ? generated.output
          : Object.keys(generated.output).map((chunkName) => generated.output[chunkName]);
      }
      return [generated];
    })
    .then((chunks) =>
      chunks.reduce((moduleIds, chunk) => moduleIds.concat(Object.keys(chunk.modules)), [])
    );
};

test('Works in rollup', (t) =>
  rollup({
    input: './test/fixtures/index.js',
    plugins: [
      alias({
        entries: [
          { find: 'fancyNumber', replacement: './aliasMe' },
          { find: './anotherFancyNumber', replacement: './localAliasMe' },
          { find: 'numberFolder', replacement: './folder' },
          { find: './numberFolder', replacement: './folder' }
        ]
      })
    ]
  })
    .then(getModuleIdsFromBundle)
    .then((moduleIds) => {
      const normalizedIds = moduleIds.map((id) => path.resolve(id)).sort();
      t.is(normalizedIds.length, 5);
      [
        '/fixtures/aliasMe.js',
        '/fixtures/folder/anotherNumber.js',
        '/fixtures/index.js',
        '/fixtures/localAliasMe.js',
        '/fixtures/nonAliased.js'
      ]
        .map((id) => path.normalize(id))
        .forEach((expectedId, index) =>
          t.is(
            normalizedIds[index].endsWith(expectedId),
            true,
            `expected ${normalizedIds[index]} to end with ${expectedId}`
          )
        );
    }));

test('Global customResolver function', (t) => {
  const customResult = 'customResult';
  const result = alias({
    entries: [
      {
        find: 'test',
        replacement: path.resolve('./test/files/folder/hipster.jsx')
      }
    ],
    resolve: ['.js', '.jsx'],
    customResolver: () => customResult
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './files/index.js'));

  t.is(resolved, customResult);
});

test('Local customResolver function', (t) => {
  const customResult = 'customResult';
  const localCustomResult = 'localCustomResult';
  const result = alias({
    entries: [
      {
        find: 'test',
        replacement: path.resolve('./test/files/folder/hipster.jsx'),
        customResolver: () => localCustomResult
      }
    ],
    resolve: ['.js', '.jsx'],
    customResolver: () => customResult
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './files/index.js'));

  t.is(resolved, localCustomResult);
});

test('Global customResolver plugin-like object', (t) => {
  const customResult = 'customResult';
  const result = alias({
    entries: [
      {
        find: 'test',
        replacement: path.resolve('./test/files/folder/hipster.jsx')
      }
    ],
    resolve: ['.js', '.jsx'],
    customResolver: {resolveId: () => customResult}
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './files/index.js'));

  t.is(resolved, customResult);
});

test('Local customResolver plugin-like object', (t) => {
  const customResult = 'customResult';
  const localCustomResult = 'localCustomResult';
  const result = alias({
    entries: [
      {
        find: 'test',
        replacement: path.resolve('./test/files/folder/hipster.jsx'),
        customResolver: {resolveId: () => localCustomResult}
      }
    ],
    resolve: ['.js', '.jsx'],
    customResolver: {resolveId: () => customResult}
  });

  const resolved = result.resolveId('test', posix.resolve(DIRNAME, './files/index.js'));

  t.is(resolved, localCustomResult);
});
