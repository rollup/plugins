import path, { posix } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import os from 'os';

import test from 'ava';
import { rollup } from 'rollup';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';

import alias from 'current-package';

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));

const isWindows = os.platform() === 'win32';

/**
 * Helper function to test configuration with Rollup
 * @param plugins is an array of plugins for Rollup, they should include "alias"
 * @param externalIds is an array of ids that will be external
 * @param tests is an array of pairs [source, importer]
 * @returns {Promise<unknown>}
 */
function resolveWithRollup(plugins, externalIds, tests) {
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
                tests.map(({ source, importer, options }) =>
                  this.resolve(source, importer, options).then((result) =>
                    result ? result.id : null
                  )
                )
              )
            );
          },
          resolveId(id) {
            if (id === 'dummy-input') return id;
            if (externalIds.includes(id)) return { id, external: true };
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
 * @param externalIds is an array of ids that will be external
 * @param tests is an array of pairs [source, importer]
 * @returns {Promise<unknown>}
 */
function resolveAliasWithRollup(aliasOptions, externalIds, tests) {
  return resolveWithRollup([alias(aliasOptions)], externalIds, tests);
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
    ['bar', 'paradise', 'global'],
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
    ['bar', 'paradise', 'global'],
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
        {
          find: new RegExp('.*pony.*'),
          replacement: 'i/am/a/barbie/girl'
        },
        { find: /^test\/$/, replacement: 'this/is/strict' }
      ]
    },
    ['fooooooooobar2019', 'i/am/a/barbie/girl', 'this/is/strict'],
    [
      {
        source: 'fooooooooobar',
        importer: '/src/importer.js'
      },
      {
        source: 'im/a/little/pony/yes',
        importer: '/src/importer.js'
      },
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
    [],
    [
      { source: 'foo2', importer: '/src/importer.js' },
      {
        source: './fooze/bar',
        importer: '/src/importer.js'
      },
      {
        source: './someFile.foo',
        importer: '/src/importer.js'
      }
    ]
  ).then((result) => t.deepEqual(result, [null, null, null])));

test('Alias entry file', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'abacaxi', replacement: './abacaxi' }]
    },
    ['./abacaxi/entry.js'],
    // eslint-disable-next-line no-undefined
    [{ source: 'abacaxi/entry.js' }]
  ).then((result) => t.deepEqual(result, ['./abacaxi/entry.js'])));

test('i/am/a/file', (t) =>
  resolveAliasWithRollup(
    {
      entries: [{ find: 'resolve', replacement: 'i/am/a/file' }]
    },
    ['i/am/a/file'],
    [{ source: 'resolve', importer: '/src/import.js' }]
  ).then((result) => t.deepEqual(result, ['i/am/a/file'])));

test('Windows absolute path aliasing', (t) => {
  if (!isWindows) {
    t.deepEqual(1, 1);
    return null;
  }

  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'resolve',
          replacement: 'E:\\react\\node_modules\\fbjs\\lib\\warning'
        }
      ]
    },
    [],
    [
      {
        source: 'resolve',
        importer: posix.resolve(DIRNAME, './fixtures/index.js')
      }
    ]
  ).then((result) => t.deepEqual(result, ['E:\\react\\node_modules\\fbjs\\lib\\warning']));
});

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
    .generate({ format: 'es' })
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
          {
            find: './anotherFancyNumber',
            replacement: './localAliasMe'
          },
          { find: 'numberFolder', replacement: './folder' },
          {
            find: './numberFolder',
            replacement: './folder'
          }
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
    [],
    [
      {
        source: 'test',
        importer: posix.resolve(DIRNAME, './files/index.js')
      }
    ]
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
    [],
    [
      {
        source: 'test',
        importer: posix.resolve(DIRNAME, './files/index.js')
      }
    ]
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
    [],
    [
      {
        source: 'test',
        importer: posix.resolve(DIRNAME, './files/index.js')
      }
    ]
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
          customResolver: {
            resolveId: () => localCustomResult
          }
        }
      ],
      customResolver: { resolveId: () => customResult }
    },
    [],
    [
      {
        source: 'test',
        importer: posix.resolve(DIRNAME, './files/index.js')
      }
    ]
  ).then((result) => t.deepEqual(result, [localCustomResult]));
});

test('supports node-resolve as a custom resolver', (t) =>
  resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'local-resolver',
          replacement: path.resolve(DIRNAME, 'fixtures'),
          customResolver: nodeResolvePlugin()
        },
        {
          find: 'global-resolver',
          replacement: path.resolve(DIRNAME, 'fixtures', 'folder')
        }
      ],
      customResolver: nodeResolvePlugin()
    },
    [],
    [
      {
        source: 'local-resolver',
        importer: posix.resolve(DIRNAME, './files/index.js')
      },
      {
        source: 'global-resolver',
        importer: posix.resolve(DIRNAME, './files/index.js')
      }
    ]
  ).then((result) =>
    t.deepEqual(result, [
      path.resolve(DIRNAME, 'fixtures', 'index.js'),
      path.resolve(DIRNAME, 'fixtures', 'folder', 'index.js')
    ])
  ));

test('Alias + rollup-plugin-node-resolve', (t) =>
  rollup({
    input: './test/fixtures/index.js',
    plugins: [
      alias({
        entries: [
          { find: 'fancyNumber', replacement: './aliasMe' },
          {
            find: './anotherFancyNumber',
            replacement: './localAliasMe'
          },
          {
            find: 'numberFolder/anotherNumber',
            replacement: './folder'
          },
          {
            find: './numberFolder',
            replacement: './folder'
          },
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

test('Forwards isEntry and custom options to a custom resolver', (t) => {
  const resolverCalls = [];
  return resolveAliasWithRollup(
    {
      entries: {
        entry: 'entry-point',
        nonEntry: 'non-entry-point'
      },
      customResolver: (...args) => {
        resolverCalls.push(args);
        return args[0];
      }
    },
    [],
    [
      { source: 'entry', importer: '/src/importer.js', options: { isEntry: true } },
      {
        source: 'nonEntry',
        importer: '/src/importer.js',
        options: { attributes: {}, isEntry: false, custom: { test: 42 } }
      }
    ]
  ).then((result) => {
    t.deepEqual(resolverCalls, [
      [
        'entry-point',
        '/src/importer.js',
        {
          attributes: {},
          custom: void 0,
          isEntry: true
        }
      ],
      [
        'non-entry-point',
        '/src/importer.js',
        {
          attributes: {},
          custom: { test: 42 },
          isEntry: false
        }
      ]
    ]);
    t.deepEqual(result, ['entry-point', 'non-entry-point']);
  });
});

test('Forwards isEntry and custom options to other plugins', (t) => {
  const resolverCalls = [];
  return resolveWithRollup(
    [
      alias({
        entries: {
          entry: 'entry-point',
          nonEntry: 'non-entry-point'
        }
      }),
      {
        name: 'test',
        resolveId(...args) {
          resolverCalls.push(args);

          if (['entry-point', 'non-entry-point'].includes(args[0])) {
            return { id: args[0], external: true };
          }
          return null;
        }
      }
    ],
    [],
    [
      { source: 'entry', importer: '/src/importer.js', options: { isEntry: true } },
      {
        source: 'nonEntry',
        importer: '/src/importer.js',
        options: { isEntry: false, custom: { test: 42 } }
      }
    ]
  ).then((result) => {
    t.deepEqual(resolverCalls, [
      [
        'entry-point',
        '/src/importer.js',
        {
          attributes: {},
          custom: void 0,
          isEntry: true
        }
      ],
      [
        'non-entry-point',
        '/src/importer.js',
        {
          attributes: {},
          custom: { test: 42 },
          isEntry: false
        }
      ]
    ]);
    t.deepEqual(result, ['entry-point', 'non-entry-point']);
  });
});

test('CustomResolver plugin-like object with buildStart', (t) => {
  const count = {
    entry: 0,
    option: 0
  };
  return resolveAliasWithRollup(
    {
      entries: [
        {
          find: 'this',
          replacement: path.resolve('./that.jsx'),
          customResolver: {
            resolveId: () => 'custom Resolver',
            buildStart: () => (count.entry += 1)
          }
        },
        {
          find: 'that',
          replacement: ''
        }
      ],
      customResolver: {
        buildStart: () => (count.option += 1)
      }
    },
    [],
    []
  ).then(() =>
    t.deepEqual(count, {
      entry: 1,
      option: 1
    })
  );
});

test('Works as CJS plugin', async (t) => {
  const require = createRequire(import.meta.url);
  const aliasCjs = require('current-package');
  const bundle = await rollup({
    input: './test/fixtures/index.js',
    plugins: [
      aliasCjs({
        entries: [
          { find: 'fancyNumber', replacement: './aliasMe' },
          {
            find: './anotherFancyNumber',
            replacement: './localAliasMe'
          },
          { find: 'numberFolder', replacement: './folder' },
          {
            find: './numberFolder',
            replacement: './folder'
          }
        ]
      })
    ]
  });
  const moduleIds = await getModuleIdsFromBundle(bundle);
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
});

test('show warning for non-absolute non-plugin resolved id', async (t) => {
  const warnList = [];
  await rollup({
    input: './test/fixtures/warn.js',
    plugins: [
      alias({
        entries: [
          {
            find: '@',
            replacement: path.relative(process.cwd(), path.join(DIRNAME, './fixtures/folder'))
          }
        ]
      })
    ],
    onwarn(log) {
      const formattedLog = { ...log, message: log.message.replace(/\\/g, '/') };
      warnList.push(formattedLog);
    }
  });
  t.deepEqual(warnList, [
    {
      message:
        'rewrote @/warn-importee.js to test/fixtures/folder/warn-importee.js but was not an abolute path and was not handled by other plugins. ' +
        'This will lead to duplicated modules for the same path. ' +
        'To avoid duplicating modules, you should resolve to an absolute path.',
      code: 'PLUGIN_WARNING',
      plugin: 'alias'
    }
  ]);
});
