import path, { posix } from 'path';

import test from 'ava';
import { rollup } from 'rollup';
import slash from 'slash';

// eslint-disable-next-line import/no-unresolved, import/extensions
import alias from '../dist';

const normalizePath = (pathToNormalize) => slash(pathToNormalize.replace(/^([A-Z]:)/, ''));
const DIRNAME = normalizePath(__dirname);

// "plugins" is an array of plugins for Rollup, they should include "alias"
// "tests" is an array of pairs [importee, importer]
function resolveWithRollup(plugins, tests) {
  return new Promise((resolve, reject) => {
    rollup({
      input: 'dummy-input',
      plugins: [
        {
          name: 'test-plugin',
          buildStart() {
            resolve(
              // The buildStart hook is the first to have access to this.resolve
              // We map the tests to an array of resulting ids
              Promise.all(
                tests.map(([importee, importer]) =>
                  this.resolve(importee, importer).then((result) => (result ? result.id : null))
                )
              )
            );
          },
          resolveId(id) {
            if (id === 'dummy-input') return id;
            return null;
          },
          load(id) {
            if (id === 'dummy-input') return 'console.log("test");';
            return null;
          }
        },
        ...plugins
      ]
      // if Rollup throws an error, this should reject the test
    }).catch(reject);
  });
}

// convenience function for just injecting the alias plugin
function resolveAliasWithRollup(aliasOptions, tests) {
  return resolveWithRollup([alias(aliasOptions)], tests);
}

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

test('Simple aliasing (array)', (t) =>
  resolveAliasWithRollup(
    {
      entries: [
        { find: 'foo', replacement: 'bar' },
        { find: 'pony', replacement: 'paradise' },
        { find: './local', replacement: 'global' }
      ]
    },
    [['foo', '/src/importer.js'], ['pony', '/src/importer.js'], ['./local', '/src/importer.js']]
  ).then((result) => t.deepEqual(result, ['bar', 'paradise', 'global'])));

test('Simple aliasing (object)', (t) =>
  resolveAliasWithRollup(
    {
      entries: {
        foo: 'bar',
        pony: 'paradise',
        './local': 'global'
      }
    },
    [['foo', '/src/importer.js'], ['pony', '/src/importer.js'], ['./local', '/src/importer.js']]
  ).then((result) => t.deepEqual(result, ['bar', 'paradise', 'global'])));

test('RegExp aliasing', (t) =>
  resolveAliasWithRollup(
    {
      entries: [
        { find: /f(o+)bar/, replacement: 'f$1bar2019' },
        { find: new RegExp('.*pony.*'), replacement: 'i/am/a/barbie/girl' },
        { find: /^test\/$/, replacement: 'this/is/strict' }
      ]
    },
    [
      ['fooooooooobar', '/src/importer.js'],
      ['im/a/little/pony/yes', '/src/importer.js'],
      ['./test', '/src/importer.js'],
      ['test', '/src/importer.js'],
      ['test/', '/src/importer.js']
    ]
  ).then((result) =>
    t.deepEqual(result, ['fooooooooobar2019', 'i/am/a/barbie/girl', null, null, 'this/is/strict'])
  ));

test('Will not confuse modules with similar names', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'foo', replacement: 'bar' }, { find: './foo', replacement: 'bar' }]
    },
    [
      ['foo2', '/src/importer.js'],
      ['./fooze/bar', '/src/importer.js'],
      ['./someFile.foo', '/src/importer.js']
    ]
  ).then((result) => t.deepEqual(result, [null, null, null])));

test('Leaves entry file untouched if matches alias', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'abacaxi', replacement: './abacaxi' }]
    },
    // eslint-disable-next-line no-undefined
    [['abacaxi/entry.js', undefined]]
  ).then((result) => t.deepEqual(result, [null])));

test('i/am/a/file', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'resolve', replacement: 'i/am/a/file' }]
    },
    [['resolve', '/src/import.js']]
  ).then((result) => t.deepEqual(result, ['i/am/a/file'])));

test('Windows absolute path aliasing', (t) =>
  resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'resolve',
          replacement: 'E:\\react\\node_modules\\fbjs\\lib\\warning'
        }
      ]
    },
    [['resolve', posix.resolve(DIRNAME, './fixtures/index.js')]]
  ).then((result) =>
    t.deepEqual(result, [normalizePath('E:\\react\\node_modules\\fbjs\\lib\\warning')])
  ));

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

test('Works in rollup with non fake input', (t) =>
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

  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'test',
          replacement: path.resolve('./test/files/folder/hipster.jsx')
        }
      ],
      customResolver: () => customResult
    },
    [['test', posix.resolve(DIRNAME, './files/index.js')]]
  ).then((result) => t.deepEqual(result, [customResult]));
});

test('Local customResolver function', (t) => {
  const customResult = 'customResult';
  const localCustomResult = 'localCustomResult';

  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'test',
          replacement: path.resolve('./test/files/folder/hipster.jsx'),
          customResolver: () => localCustomResult
        }
      ],
      customResolver: () => customResult
    },
    [['test', posix.resolve(DIRNAME, './files/index.js')]]
  ).then((result) => t.deepEqual(result, [localCustomResult]));
});

test('Global customResolver plugin-like object', (t) => {
  const customResult = 'customResult';

  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'test',
          replacement: path.resolve('./test/files/folder/hipster.jsx')
        }
      ],
      customResolver: { resolveId: () => customResult }
    },
    [['test', posix.resolve(DIRNAME, './files/index.js')]]
  ).then((result) => t.deepEqual(result, [customResult]));
});

test('Local customResolver plugin-like object', (t) => {
  const customResult = 'customResult';
  const localCustomResult = 'localCustomResult';

  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'test',
          replacement: path.resolve('./test/files/folder/hipster.jsx'),
          customResolver: { resolveId: () => localCustomResult }
        }
      ],
      customResolver: { resolveId: () => customResult }
    },
    [['test', posix.resolve(DIRNAME, './files/index.js')]]
  ).then((result) => t.deepEqual(result, [localCustomResult]));
});

/** @TODO
 *  Needs to be modified with smth like rollup-plugin-node-resolve
 *  after such plugin would became a part of rollup-plugins monorepo
 */

// test('Local aliasing', (t) => {
//   const result = alias({
//     entries: [{ find: 'foo', replacement: './bar' }, { find: 'pony', replacement: './par/a/di/se' }]
//   });
//
//   const resolved = result.resolveId('foo', '/src/importer.js');
//   const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
//   const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
//   const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');
//
//   t.is(resolved, '/src/bar.js');
//   t.is(resolved2, '/src/bar/baz.js');
//   t.is(resolved3, '/src/bar/baz.js');
//   t.is(resolved4, '/src/highly/nested/par/a/di/se.js');
// });
//
// test('Absolute local aliasing', (t) => {
//   const result = alias({
//     entries: [
//       { find: 'foo', replacement: '/bar' },
//       { find: 'pony', replacement: '/par/a/di/se.js' }
//     ]
//   });
//
//   const resolved = result.resolveId('foo', '/src/importer.js');
//   const resolved2 = result.resolveId('foo/baz', '/src/importer.js');
//   const resolved3 = result.resolveId('foo/baz.js', '/src/importer.js');
//   const resolved4 = result.resolveId('pony', '/src/highly/nested/importer.js');
//
//   t.is(resolved, '/bar.js');
//   t.is(resolved2, '/bar/baz.js');
//   t.is(resolved3, '/bar/baz.js');
//   t.is(resolved4, '/par/a/di/se.js');
// });
