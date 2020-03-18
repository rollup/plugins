import path, { posix } from 'path';

import test from 'ava';
import { rollup } from 'rollup';
import slash from 'slash';

// eslint-disable-next-line import/no-unresolved, import/extensions
import nodeResolvePlugin from '@rollup/plugin-node-resolve';

import alias from '../dist';

const normalizePath = (pathToNormalize) => slash(pathToNormalize.replace(/^([A-Z]:)/, ''));
const DIRNAME = normalizePath(__dirname);

/**
 * Helper function to test configuration with Rollup
 * @param plugins is an array of plugins for Rollup, they should include "alias"
 * @param tests is an array of pairs [source, importer]
 * @returns {Promise<unknown>}
 */
function resolveWithRollup(plugins, tests) {
  if (!plugins.find((p) => p.name === 'alias')) {
    throw new Error('`plugins` should include the alias plugin.');
  }
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
                tests.map(({ source, importer }) =>
                  this.resolve(source, importer).then((result) => (result ? result.id : null))
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

/**
 * Helper function to test configuration with Rollup and injected alias plugin
 * @param aliasOptions is a configuration for alias plugin
 * @param tests is an array of pairs [source, importer]
 * @returns {Promise<unknown>}
 */
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
    [
      { source: 'foo', importer: '/src/importer.js' },
      { source: 'pony', importer: '/src/importer.js' },
      { source: './local', importer: '/src/importer.js' }
    ]
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
    [
      { source: 'foo', importer: '/src/importer.js' },
      { source: 'pony', importer: '/src/importer.js' },
      { source: './local', importer: '/src/importer.js' }
    ]
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
      { source: 'fooooooooobar', importer: '/src/importer.js' },
      { source: 'im/a/little/pony/yes', importer: '/src/importer.js' },
      { source: './test', importer: '/src/importer.js' },
      { source: 'test', importer: '/src/importer.js' },
      { source: 'test/', importer: '/src/importer.js' }
    ]
  ).then((result) =>
    t.deepEqual(result, ['fooooooooobar2019', 'i/am/a/barbie/girl', null, null, 'this/is/strict'])
  ));

test('Will not confuse modules with similar names', (t) =>
  resolveAliasWithRollup(
    {
      entries: [
        { find: 'foo', replacement: 'bar' },
        { find: './foo', replacement: 'bar' }
      ]
    },
    [
      { source: 'foo2', importer: '/src/importer.js' },
      { source: './fooze/bar', importer: '/src/importer.js' },
      { source: './someFile.foo', importer: '/src/importer.js' }
    ]
  ).then((result) => t.deepEqual(result, [null, null, null])));

test('Leaves entry file untouched if matches alias', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'abacaxi', replacement: './abacaxi' }]
    },
    // eslint-disable-next-line no-undefined
    [{ source: 'abacaxi/entry.js' }]
  ).then((result) => t.deepEqual(result, [null])));

test('i/am/a/file', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'resolve', replacement: 'i/am/a/file' }]
    },
    [{ source: 'resolve', importer: '/src/import.js' }]
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
    [{ source: 'resolve', importer: posix.resolve(DIRNAME, './fixtures/index.js') }]
  ).then((result) =>
    t.deepEqual(result, [normalizePath('E:\\react\\node_modules\\fbjs\\lib\\warning')])
  ));

/**
 * Helper function to get moduleIDs from final Rollup bundle
 * @param bundle Rollup bundle
 * @returns {PromiseLike<T>|Promise<unknown>}
 */
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
    [{ source: 'test', importer: posix.resolve(DIRNAME, './files/index.js') }]
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
    [{ source: 'test', importer: posix.resolve(DIRNAME, './files/index.js') }]
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
    [{ source: 'test', importer: posix.resolve(DIRNAME, './files/index.js') }]
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
    [{ source: 'test', importer: posix.resolve(DIRNAME, './files/index.js') }]
  ).then((result) => t.deepEqual(result, [localCustomResult]));
});

/** @TODO
 *  Needs to be modified after rollup-plugin-node-resolve would became a part of rollup-plugins monorepo
 */
test('Alias + rollup-plugin-node-resolve', (t) =>
  rollup({
    input: './test/fixtures/index.js',
    plugins: [
      alias({
        entries: [
          { find: 'fancyNumber', replacement: './aliasMe' },
          { find: './anotherFancyNumber', replacement: './localAliasMe' },
          { find: 'numberFolder/anotherNumber', replacement: './folder' },
          { find: './numberFolder', replacement: './folder' },
          { find: 'superdeep', replacement: './deep/deep2' }
        ]
      }),
      nodeResolvePlugin()
    ]
  })
    .then(getModuleIdsFromBundle)
    .then((moduleIds) => {
      const normalizedIds = moduleIds.map((id) => path.resolve(id)).sort();
      t.is(normalizedIds.length, 6);
      [
        '/fixtures/aliasMe.js',
        '/fixtures/folder/anotherNumber.js',
        '/fixtures/folder/deep/deep2/index.js',
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
