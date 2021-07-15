import * as nodePath from 'path';
import * as fs from 'fs';

import test from 'ava';
import { rollup } from 'rollup';
import { SourceMapConsumer } from 'source-map';
import jsonPlugin from '@rollup/plugin-json';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';
import { createFilter } from '@rollup/pluginutils';

import { getCode } from '../../../util/test';

import babelPlugin, { getBabelOutputPlugin, createBabelInputPluginFactory } from '../dist';

process.chdir(__dirname);

function getLocation(source, charIndex) {
  const lines = source.split('\n');
  const len = lines.length;

  let lineStart = 0;

  for (let i = 0; i < len; i += 1) {
    const line = lines[i];
    // +1 for newline
    const lineEnd = lineStart + line.length + 1;

    if (lineEnd > charIndex) {
      return { line: i + 1, column: charIndex - lineStart };
    }

    lineStart = lineEnd;
  }

  throw new Error('Could not determine location of character');
}

function replaceConsoleLogProperty({ types: t }) {
  return {
    name: 'replace-console-log-property',
    visitor: {
      MemberExpression(path, state) {
        const { opts } = state;
        if (path.node.property.name === 'log') {
          path.get('property').replaceWith(t.identifier(opts.replace));
        }
      }
    }
  };
}

async function generate(input, babelOptions = {}, generateOptions = {}, rollupOptions = {}) {
  const bundle = await rollup({
    input,
    plugins: [babelPlugin({ babelHelpers: 'bundled', ...babelOptions })],
    ...rollupOptions
  });

  return getCode(bundle, {
    format: 'cjs',
    exports: 'auto',
    ...generateOptions
  });
}

test('runs code through babel', async (t) => {
  const code = await generate('fixtures/basic/main.js');
  t.false(code.includes('const'));
  t.is(
    code,
    `'use strict';

var answer = 42;
console.log("the answer is ".concat(answer));
`
  );
});

test('adds helpers', async (t) => {
  const code = await generate('fixtures/class/main.js');
  t.true(code.includes('function _classCallCheck'));
});

test('adds helpers in loose mode', async (t) => {
  const code = await generate('fixtures/class-loose/main.js');
  t.true(code.includes('function _inherits'));
});

test('does not babelify excluded code', async (t) => {
  const code = await generate('fixtures/exclusions/main.js', { exclude: '**/foo.js' });
  // eslint-disable-next-line no-template-curly-in-string
  t.false(code.includes('${foo()}'));
  t.true(code.includes('=> 42'));
  t.is(
    code,
    `'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`
  );
});

test('does not babelify excluded code with custom filter', async (t) => {
  const filter = createFilter([], '**/foo.js');
  const code = await generate('fixtures/exclusions/main.js', { filter });
  // eslint-disable-next-line no-template-curly-in-string
  t.false(code.includes('${foo()}'));
  t.true(code.includes('=> 42'));
  t.is(
    code,
    `'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`
  );
});

test('does babelify included code with custom filter', async (t) => {
  const filter = createFilter('**/foo.js', [], {
    resolve: __dirname
  });
  const code = await generate('fixtures/exclusions/main.js', { filter });
  // eslint-disable-next-line no-template-curly-in-string
  t.true(code.includes('${foo()}'));
  t.false(code.includes('=> 42'));
  t.is(
    code,
    `'use strict';

var foo = function foo() {
  return 42;
};

console.log(\`the answer is \${foo()}\`);
`
  );
});

test('can not pass include or exclude when custom filter specified', async (t) => {
  const filter = createFilter('**/foo.js', [], {
    resolve: __dirname
  });
  let errorWithExclude = '';
  try {
    await generate('fixtures/exclusions/main.js', { filter, exclude: [] });
  } catch (e) {
    errorWithExclude = e.message;
  }
  t.true(!!errorWithExclude);

  let errorWithInclude = '';
  try {
    await generate('fixtures/exclusions/main.js', { filter, include: [] });
  } catch (e) {
    errorWithInclude = e.message;
  }
  t.true(!!errorWithInclude);
});

test('generates sourcemap by default', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/class/main.js',
    plugins: [babelPlugin({ babelHelpers: 'bundled' })]
  });

  const {
    output: [{ code, map }]
  } = await bundle.generate({ format: 'cjs', exports: 'auto', sourcemap: true });

  const target = 'log';
  const smc = await new SourceMapConsumer(map);
  const loc = getLocation(code, code.indexOf(target));
  const original = smc.originalPositionFor(loc);

  t.deepEqual(original, {
    source: 'fixtures/class/main.js'.split(nodePath.sep).join('/'),
    line: 3,
    column: 12,
    name: target
  });
});

test('works with proposal-decorators (rollup/rollup-plugin-babel#18)', async (t) => {
  await t.notThrowsAsync(() =>
    rollup({
      input: 'fixtures/proposal-decorators/main.js',
      plugins: [babelPlugin({ babelHelpers: 'bundled' })]
    })
  );
});

test('checks config per-file', async (t) => {
  const code = await generate('fixtures/checks/main.js', {}, { format: 'esm' });
  t.true(code.includes('class Foo'));
  t.true(code.includes('var Bar'));
  t.false(code.includes('class Bar'));
});

test('allows transform-runtime to be used instead of bundled helpers', async (t) => {
  const warnings = [];
  const code = await generate(
    'fixtures/runtime-helpers/main.js',
    { babelHelpers: 'runtime' },
    {},
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  t.deepEqual(warnings, [
    `'@babel/runtime/helpers/classCallCheck' is imported by fixtures${nodePath.sep}runtime-helpers${nodePath.sep}main.js, but could not be resolved – treating it as an external dependency`
  ]);
  t.is(
    code,
    `'use strict';

var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);

var Foo = function Foo() {
  _classCallCheck__default['default'](this, Foo);
};

module.exports = Foo;
`
  );
});

test('allows transform-runtime to inject esm version of helpers', async (t) => {
  const warnings = [];
  const code = await generate(
    'fixtures/runtime-helpers-esm/main.js',
    { babelHelpers: 'runtime' },
    {
      format: 'esm'
    },
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  t.deepEqual(warnings, [
    `'@babel/runtime/helpers/esm/classCallCheck' is imported by fixtures${nodePath.sep}runtime-helpers-esm${nodePath.sep}main.js, but could not be resolved – treating it as an external dependency`
  ]);
  t.is(
    code,
    `import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

export default Foo;
`
  );
});

test('allows transform-runtime to be used instead of bundled helpers, but throws when CommonJS is used', async (t) => {
  await t.throwsAsync(
    () => generate('fixtures/runtime-helpers-commonjs/main.js', { babelHelpers: 'runtime' }),
    {
      message: /Rollup requires that your Babel configuration keeps ES6 module syntax intact/
    }
  );
});

test('allows using external-helpers plugin in combination with @babel/plugin-external-helpers', async (t) => {
  const code = await generate('fixtures/external-helpers/main.js', {
    babelHelpers: 'external'
  });
  t.false(code.includes('function _classCallCheck'));
  t.true(code.includes('babelHelpers.classCallCheck'));
  t.is(
    code,
    `'use strict';

var Foo = function Foo() {
  babelHelpers.classCallCheck(this, Foo);
};

var Bar = function Bar() {
  babelHelpers.classCallCheck(this, Bar);
};

var main = [new Foo(), new Bar()];

module.exports = main;
`
  );
});

test('correctly renames helpers (rollup/rollup-plugin-babel#22)', async (t) => {
  const code = await generate('fixtures/named-function-helper/main.js');
  t.false(code.includes('babelHelpers_get get'), 'helper was incorrectly renamed');
});

test('runs preflight check correctly in absence of class transformer (rollup/rollup-plugin-babel#23)', async (t) => {
  await t.notThrowsAsync(() =>
    rollup({
      input: 'fixtures/no-class-transformer/main.js',
      plugins: [babelPlugin({ babelHelpers: 'bundled' })]
    })
  );
});

test('produces valid code with typeof helper', async (t) => {
  const code = await generate('fixtures/typeof/main.js');
  t.false(code.includes('var typeof'));
});

test('handles babelrc with ignore option used', async (t) => {
  const code = await generate('fixtures/ignored-file/main.js');
  t.true(code.includes('class Ignored'));
});

test('transpiles only files with default extensions', async (t) => {
  const code = await generate(
    'fixtures/extensions-default/main.js',
    {},
    {},
    {
      plugins: [babelPlugin({ babelHelpers: 'bundled' }), jsonPlugin()]
    }
  );
  t.false(code.includes('class Es '), 'should transpile .es');
  t.false(code.includes('class Es6 '), 'should transpile .es6');
  t.false(code.includes('class Js '), 'should transpile .js');
  t.false(code.includes('class Jsx '), 'should transpile .jsx');
  t.false(code.includes('class Mjs '), 'should transpile .mjs');
  t.true(code.includes('class Other '), 'should not transpile .other');
});

test('transpiles only files with whitelisted extensions', async (t) => {
  const code = await generate('fixtures/extensions-custom/main.js', {
    extensions: ['.js', '.other']
  });
  t.true(code.includes('class Es '), 'should not transpile .es');
  t.true(code.includes('class Es6 '), 'should not transpile .es6');
  t.false(code.includes('class Js '), 'should transpile .js');
  t.true(code.includes('class Jsx '), 'should not transpile .jsx');
  t.true(code.includes('class Mjs '), 'should not transpile .mjs');
  t.false(code.includes('class Other '), 'should transpile .other');
});

test('transpiles files when path contains query and hash', async (t) => {
  const code = await generate(
    'fixtures/with-query-and-hash/main.js',
    {},
    {},
    {
      plugins: [
        babelPlugin({ babelHelpers: 'bundled' }),
        // node-resolve plugin know how to resolve relative request with query
        nodeResolvePlugin(),
        {
          load(id) {
            // rollup don't know how to load module with query
            // we could teach rollup to discard query while loading module
            const [bareId] = id.split(`?`);
            return fs.readFileSync(bareId, 'utf-8');
          }
        }
      ]
    }
  );
  t.true(code.includes('function WithQuery()'), 'should transpile when path contains query');
  t.true(code.includes('function WithHash()'), 'should transpile when path contains hash');
  t.true(
    code.includes('function WithQueryAndHash()'),
    'should transpile when path contains query and hash'
  );
});

test('throws when trying to add babel helper unavailable in used @babel/core version', async (t) => {
  await t.throwsAsync(
    () =>
      generate('fixtures/basic/main.js', {
        plugins: [
          function testPlugin() {
            return {
              visitor: {
                Program(path, state) {
                  state.file.addHelper('__nonexistentHelper');
                }
              }
            };
          }
        ]
      }),
    {
      message: `${nodePath.resolve(
        __dirname,
        'fixtures',
        'basic',
        'main.js'
      )}: Unknown helper __nonexistentHelper`
    }
  );
});

test('works with minified bundled helpers', async (t) => {
  const BASE_CHAR_CODE = 'a'.charCodeAt(0);
  let counter = 0;

  await t.notThrowsAsync(() =>
    generate('fixtures/class/main.js', {
      plugins: [
        function testPlugin({ types }) {
          return {
            visitor: {
              FunctionDeclaration(path) {
                // super simple mangling
                path
                  .get('id')
                  .replaceWith(types.identifier(String.fromCharCode(BASE_CHAR_CODE + counter)));

                counter += 1;
              }
            }
          };
        }
      ]
    })
  );
});

test('supports customizing the loader', async (t) => {
  const expectedRollupContextKeys = ['getCombinedSourcemap', 'getModuleIds', 'emitFile', 'resolve'];
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      config(cfg) {
        t.true(typeof this === 'object', 'override config this context is rollup context');
        expectedRollupContextKeys.forEach((key) => {
          t.true(
            Object.keys(this).includes(key),
            `override config this context is rollup context with key ${key}`
          );
        });
        return {
          ...cfg.options,
          plugins: [
            ...(cfg.options.plugins || []),
            // Include a custom plugin in the options.
            [replaceConsoleLogProperty, { replace: 'foobaz' }]
          ]
        };
      },
      result(result) {
        t.true(typeof this === 'object', 'override result this context is rollup context');
        expectedRollupContextKeys.forEach((key) => {
          t.true(
            Object.keys(this).includes(key),
            `override result this context is rollup context with key ${key}`
          );
        });
        return {
          ...result,
          code: `${result.code}\n// Generated by some custom loader`
        };
      }
    };
  });
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [customBabelPlugin({ babelHelpers: 'bundled' })]
  });
  const code = await getCode(bundle);

  t.true(code.includes('// Generated by some custom loader'), 'adds the custom comment');
  t.true(code.includes('console.foobaz'), 'runs the plugin');
});

test('supports overriding the plugin options in custom loader', async (t) => {
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      options(options) {
        // Ignore the js extension to test overriding the options
        return { pluginOptions: { ...options, extensions: ['.x'] } };
      },
      config(cfg) {
        return {
          ...cfg.options,
          plugins: [
            ...(cfg.options.plugins || []),
            // Include a custom plugin in the options.
            [replaceConsoleLogProperty, { replace: 'foobaz' }]
          ]
        };
      },
      result(result) {
        return {
          ...result,
          code: `${result.code}\n// Generated by some custom loader`
        };
      }
    };
  });
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [customBabelPlugin({ babelHelpers: 'bundled' })]
  });
  const code = await getCode(bundle);

  t.false(
    code.includes('// Generated by some custom loader'),
    'does not add the comment to ignored file'
  );
  t.false(code.includes('console.foobaz'), 'does not run the plugin on ignored file');
});

test('uses babel plugins passed in to the rollup plugin', async (t) => {
  const code = await generate('fixtures/basic/main.js', {
    plugins: [[replaceConsoleLogProperty, { replace: 'foobaz' }]]
  });
  t.true(code.includes('console.foobaz'));
});

test('can be used as an input plugin while transforming the output', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [
      getBabelOutputPlugin({
        presets: ['@babel/env']
      })
    ]
  });
  const code = await getCode(bundle);

  t.false(code.includes('const'));
});
