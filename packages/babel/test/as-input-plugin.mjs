import { createRequire } from 'node:module';
import * as nodePath from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'url';

import { test, expect } from 'vitest';
import { rollup } from 'rollup';
import jsonPlugin from '@rollup/plugin-json';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';
import { createFilter } from '@rollup/pluginutils';

import babelPlugin, { getBabelOutputPlugin, createBabelInputPluginFactory } from 'current-package';

import { getCode } from '../../../util/test.js';

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES = `${DIRNAME}/fixtures/`;
function getLocation(source, charIndex) {
  const lines = source.split('\n');
  const len = lines.length;
  let lineStart = 0;
  for (let i = 0; i < len; i += 1) {
    const line = lines[i];
    // +1 for newline
    const lineEnd = lineStart + line.length + 1;
    if (lineEnd > charIndex) {
      return {
        line: i + 1,
        column: charIndex - lineStart
      };
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
    input: FIXTURES + input,
    plugins: [
      babelPlugin({
        babelHelpers: 'bundled',
        ...babelOptions
      })
    ],
    ...rollupOptions
  });
  return getCode(bundle, {
    format: 'cjs',
    exports: 'auto',
    ...generateOptions
  });
}
test('runs code through babel', async () => {
  const code = await generate('basic/main.js');
  expect(code.includes('const')).toBe(false);
  expect(code).toBe(`'use strict';

var answer = 42;
console.log("the answer is ".concat(answer));
`);
});
test('adds helpers', async () => {
  const code = await generate('class/main.js');
  expect(code.includes('function _classCallCheck')).toBe(true);
});
test('adds helpers in loose mode', async () => {
  const code = await generate('class-loose/main.js');
  expect(code.includes('function _inherits')).toBe(true);
});
test('does not babelify excluded code', async () => {
  const code = await generate('exclusions/main.js', {
    exclude: '**/foo.js'
  });
  // eslint-disable-next-line no-template-curly-in-string
  expect(code.includes('${foo()}')).toBe(false);
  expect(code.includes('=> 42')).toBe(true);
  expect(code).toBe(`'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`);
});
test('does not babelify excluded code with custom filter', async () => {
  const filter = createFilter([], '**/foo.js');
  const code = await generate('exclusions/main.js', {
    filter
  });
  // eslint-disable-next-line no-template-curly-in-string
  expect(code.includes('${foo()}')).toBe(false);
  expect(code.includes('=> 42')).toBe(true);
  expect(code).toBe(`'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`);
});
test('does not babelify excluded code with code-based filter', async () => {
  const filter = (id, code) => code.includes('the answer is');
  const code = await generate('exclusions/main.js', {
    filter
  });
  // eslint-disable-next-line no-template-curly-in-string
  expect(code.includes('${foo()}')).toBe(false);
  expect(code.includes('=> 42')).toBe(true);
  expect(code).toBe(`'use strict';

const foo = () => 42;

console.log("the answer is ".concat(foo()));
`);
});
test('does babelify included code with custom filter', async () => {
  const filter = createFilter('**/foo.js', [], {
    resolve: DIRNAME
  });
  const code = await generate('exclusions/main.js', {
    filter
  });
  // eslint-disable-next-line no-template-curly-in-string
  expect(code.includes('${foo()}')).toBe(true);
  expect(code.includes('=> 42')).toBe(false);
  expect(code).toBe(`'use strict';

var foo = function foo() {
  return 42;
};

console.log(\`the answer is \${foo()}\`);
`);
});
test('does babelify excluded code with code-based filter', async () => {
  const filter = (id, code) => !code.includes('the answer is');
  const code = await generate('exclusions/main.js', {
    filter
  });
  // eslint-disable-next-line no-template-curly-in-string
  expect(code.includes('${foo()}')).toBe(true);
  expect(code.includes('=> 42')).toBe(false);
  expect(code).toBe(`'use strict';

var foo = function foo() {
  return 42;
};

console.log(\`the answer is \${foo()}\`);
`);
});
test('can not pass include or exclude when custom filter specified', async () => {
  const filter = createFilter('**/foo.js', [], {
    resolve: DIRNAME
  });
  let errorWithExclude = '';
  try {
    await generate('exclusions/main.js', {
      filter,
      exclude: []
    });
  } catch (e) {
    errorWithExclude = e.message;
  }
  expect(!!errorWithExclude).toBe(true);
  let errorWithInclude = '';
  try {
    await generate('exclusions/main.js', {
      filter,
      include: []
    });
  } catch (e) {
    errorWithInclude = e.message;
  }
  expect(!!errorWithInclude).toBe(true);
});
test('generates sourcemap by default', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}class/main.js`,
    plugins: [
      babelPlugin({
        babelHelpers: 'bundled'
      })
    ]
  });
  const {
    output: [{ code, map }]
  } = await bundle.generate({
    format: 'cjs',
    exports: 'auto',
    sourcemap: true
  });
  const target = 'log';

  // source-map uses the presence of fetch to detect browser environments which
  // breaks in Node 18
  const { fetch } = global;
  delete global.fetch;
  const { SourceMapConsumer } = await import('source-map');
  const smc = await new SourceMapConsumer(map);
  global.fetch = fetch;
  const loc = getLocation(code, code.indexOf(target));
  const original = smc.originalPositionFor(loc);
  expect(original).toEqual({
    source: 'test/fixtures/class/main.js'.split(nodePath.sep).join('/'),
    line: 3,
    column: 12,
    name: target
  });
});
test('works with proposal-decorators (rollup/rollup-plugin-babel#18)', async () => {
  await expect(
    rollup({
      input: `${FIXTURES}proposal-decorators/main.js`,
      plugins: [
        babelPlugin({
          babelHelpers: 'bundled'
        })
      ]
    })
  ).resolves.toBeDefined();
});
test('checks config per-file', async () => {
  const code = await generate(
    'checks/main.js',
    {},
    {
      format: 'es'
    }
  );
  expect(code.includes('class Foo')).toBe(true);
  expect(code.includes('var Bar')).toBe(true);
  expect(code.includes('class Bar')).toBe(false);
});
test('allows transform-runtime to be used instead of bundled helpers', async () => {
  const warnings = [];
  const code = await generate(
    'runtime-helpers/main.js',
    {
      babelHelpers: 'runtime'
    },
    {},
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  expect(warnings).toEqual([
    `"@babel/runtime/helpers/createClass" is imported by "test/fixtures/runtime-helpers/main.js", but could not be resolved – treating it as an external dependency.`,
    `"@babel/runtime/helpers/classCallCheck" is imported by "test/fixtures/runtime-helpers/main.js", but could not be resolved – treating it as an external dependency.`
  ]);
  expect(code).toBe(`'use strict';

var _createClass = require('@babel/runtime/helpers/createClass');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');

var Foo = /*#__PURE__*/_createClass(function Foo() {
  _classCallCheck(this, Foo);
});

module.exports = Foo;
`);
});
test('allows transform-runtime to inject esm version of helpers', async () => {
  const warnings = [];
  const code = await generate(
    'runtime-helpers-esm/main.js',
    {
      babelHelpers: 'runtime'
    },
    {
      format: 'es'
    },
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  expect(warnings).toEqual([
    `"@babel/runtime/helpers/esm/createClass" is imported by "test/fixtures/runtime-helpers-esm/main.js", but could not be resolved – treating it as an external dependency.`,
    `"@babel/runtime/helpers/esm/classCallCheck" is imported by "test/fixtures/runtime-helpers-esm/main.js", but could not be resolved – treating it as an external dependency.`
  ]);
  expect(code).toBe(`import _createClass from '@babel/runtime/helpers/esm/createClass';
import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';

var Foo = /*#__PURE__*/_createClass(function Foo() {
  _classCallCheck(this, Foo);
});

export { Foo as default };
`);
});
test('allows transform-runtime to be used instead of bundled helpers, but throws when CommonJS is used', async () => {
  await expect(
    generate('runtime-helpers-commonjs/main.js', {
      babelHelpers: 'runtime'
    })
  ).rejects.toThrow(/Rollup requires that your Babel configuration keeps ES6 module syntax intact/);
});
test('allows using external-helpers plugin in combination with @babel/plugin-external-helpers', async () => {
  const code = await generate('external-helpers/main.js', {
    babelHelpers: 'external'
  });
  expect(code.includes('function _classCallCheck')).toBe(false);
  expect(code.includes('babelHelpers.classCallCheck')).toBe(true);
  expect(code).toBe(`'use strict';

var Foo = /*#__PURE__*/babelHelpers.createClass(function Foo() {
  babelHelpers.classCallCheck(this, Foo);
});

var Bar = /*#__PURE__*/babelHelpers.createClass(function Bar() {
  babelHelpers.classCallCheck(this, Bar);
});

var main = [new Foo(), new Bar()];

module.exports = main;
`);
});
test('correctly renames helpers (rollup/rollup-plugin-babel#22)', async () => {
  const code = await generate('named-function-helper/main.js');
  expect(code.includes('babelHelpers_get get')).toBe(false);
});
test('runs preflight check correctly in absence of class transformer (rollup/rollup-plugin-babel#23)', async () => {
  await expect(
    rollup({
      input: `${FIXTURES}no-class-transformer/main.js`,
      plugins: [
        babelPlugin({
          babelHelpers: 'bundled'
        })
      ]
    })
  ).resolves.toBeDefined();
});
test('produces valid code with typeof helper', async () => {
  const code = await generate('typeof/main.js');
  expect(code.includes('var typeof')).toBe(false);
});
test('handles babelrc with ignore option used', async () => {
  const code = await generate('ignored-file/main.js');
  expect(code.includes('class Ignored')).toBe(true);
});
test('transpiles only files with default extensions', async () => {
  const code = await generate(
    'extensions-default/main.js',
    {},
    {},
    {
      plugins: [
        babelPlugin({
          babelHelpers: 'bundled'
        }),
        jsonPlugin()
      ]
    }
  );
  expect(code.includes('class Es ')).toBe(false);
  expect(code.includes('class Es6 ')).toBe(false);
  expect(code.includes('class Js ')).toBe(false);
  expect(code.includes('class Jsx ')).toBe(false);
  expect(code.includes('class Mjs ')).toBe(false);
  expect(code.includes('class Other ')).toBe(true);
});
test('transpiles only files with whitelisted extensions', async () => {
  const code = await generate('extensions-custom/main.js', {
    extensions: ['.js', '.other']
  });
  expect(code.includes('class Es ')).toBe(true);
  expect(code.includes('class Es6 ')).toBe(true);
  expect(code.includes('class Js ')).toBe(false);
  expect(code.includes('class Jsx ')).toBe(true);
  expect(code.includes('class Mjs ')).toBe(true);
  expect(code.includes('class Other ')).toBe(false);
});
test('transpiles files when path contains query and hash', async () => {
  const code = await generate(
    'with-query-and-hash/main.js',
    {},
    {},
    {
      plugins: [
        babelPlugin({
          babelHelpers: 'bundled'
        }),
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
  expect(code.includes('function WithQuery()')).toBe(true);
  expect(code.includes('function WithHash()')).toBe(true);
  expect(code.includes('function WithQueryAndHash()')).toBe(true);
});
test('throws when trying to add babel helper unavailable in used @babel/core version', async () => {
  await expect(
    generate('basic/main.js', {
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
    })
  ).rejects.toThrow(
    `${nodePath.resolve(
      DIRNAME,
      'fixtures',
      'basic',
      'main.js'
    )}: Unknown helper __nonexistentHelper`
  );
});
test('works with minified bundled helpers', async () => {
  const BASE_CHAR_CODE = 'a'.charCodeAt(0);
  let counter = 0;
  await expect(
    generate('class/main.js', {
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
  ).resolves.toBeDefined();
});
test('supports customizing the loader', async () => {
  const expectedRollupContextKeys = ['getCombinedSourcemap', 'getModuleIds', 'emitFile', 'resolve'];
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      config(cfg) {
        expect(typeof this === 'object').toBe(true);
        expectedRollupContextKeys.forEach((key) => {
          expect(Object.keys(this).includes(key)).toBe(true);
        });
        return {
          ...cfg.options,
          plugins: [
            ...(cfg.options.plugins || []),
            // Include a custom plugin in the options.
            [
              replaceConsoleLogProperty,
              {
                replace: 'foobaz'
              }
            ]
          ]
        };
      },
      result(result) {
        expect(typeof this === 'object').toBe(true);
        expectedRollupContextKeys.forEach((key) => {
          expect(Object.keys(this).includes(key)).toBe(true);
        });
        return {
          ...result,
          code: `${result.code}\n// Generated by some custom loader`
        };
      }
    };
  });
  const bundle = await rollup({
    input: `${FIXTURES}basic/main.js`,
    plugins: [
      customBabelPlugin({
        babelHelpers: 'bundled'
      })
    ]
  });
  const code = await getCode(bundle);
  expect(code.includes('// Generated by some custom loader')).toBe(true);
  expect(code.includes('console.foobaz')).toBe(true);
});
test('supports overriding the plugin options in custom loader', async () => {
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      options(options) {
        // Ignore the js extension to test overriding the options
        return {
          pluginOptions: {
            ...options,
            extensions: ['.x']
          }
        };
      },
      config(cfg) {
        return {
          ...cfg.options,
          plugins: [
            ...(cfg.options.plugins || []),
            // Include a custom plugin in the options.
            [
              replaceConsoleLogProperty,
              {
                replace: 'foobaz'
              }
            ]
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
    input: `${FIXTURES}basic/main.js`,
    plugins: [
      customBabelPlugin({
        babelHelpers: 'bundled'
      })
    ]
  });
  const code = await getCode(bundle);
  expect(code.includes('// Generated by some custom loader')).toBe(false);
  expect(code.includes('console.foobaz')).toBe(false);
});
test('uses babel plugins passed in to the rollup plugin', async () => {
  const code = await generate('basic/main.js', {
    plugins: [
      [
        replaceConsoleLogProperty,
        {
          replace: 'foobaz'
        }
      ]
    ]
  });
  expect(code.includes('console.foobaz')).toBe(true);
});
test('can be used as an input plugin while transforming the output', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}basic/main.js`,
    plugins: [
      getBabelOutputPlugin({
        presets: ['@babel/env']
      })
    ]
  });
  const code = await getCode(bundle);
  expect(code.includes('const')).toBe(false);
});
test('works as a CJS plugin', async () => {
  const require = createRequire(import.meta.url);
  const babelPluginCjs = require('current-package');
  const bundle = await rollup({
    input: `${FIXTURES}basic/main.js`,
    plugins: [
      babelPluginCjs({
        presets: ['@babel/env']
      })
    ]
  });
  const code = await getCode(bundle);
  expect(code.includes('const')).toBe(false);
});

test('works in parallel as a CJS plugin', async () => {
  const require = createRequire(import.meta.url);
  const babelPluginCjs = require('current-package');
  const bundle = await rollup({
    input: `${FIXTURES}basic/main.js`,
    plugins: [
      babelPluginCjs({
        babelHelpers: 'bundled',
        presets: ['@babel/env'],
        parallel: true
      })
    ]
  });
  const code = await getCode(bundle);
  expect(code.includes('const')).toBe(false);
  expect(code.includes('var answer')).toBe(true);
});

test('works in parallel', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}proposal-decorators/main.js`,
    plugins: [babelPlugin({ parallel: true })]
  });
  const code = await getCode(bundle);

  expect(code.includes('_createClass')).toBe(true);
});

test('works in parallel with specified worker count', async () => {
  const code = await generate('basic/main.js', { parallel: 2 });
  expect(code.includes('const')).toBe(false);
  expect(code.includes('var answer = 42')).toBe(true);
});

test('throws when parallel option is not a positive integer', () => {
  expect(() => babelPlugin({ babelHelpers: 'bundled', parallel: 0 })).toThrow(
    /must be true or a positive integer/
  );
  expect(() => babelPlugin({ babelHelpers: 'bundled', parallel: -1 })).toThrow(
    /must be true or a positive integer/
  );
  expect(() => babelPlugin({ babelHelpers: 'bundled', parallel: 2.5 })).toThrow(
    /must be true or a positive integer/
  );
  expect(() => babelPlugin({ babelHelpers: 'bundled', parallel: NaN })).toThrow(
    /must be true or a positive integer/
  );
});

test('throws when using parallel with non-serializable babel options', async () => {
  await expect(() =>
    generate('basic/main.js', {
      parallel: true,
      plugins: [
        // Functions are not serializable
        function customPlugin() {
          return { visitor: {} };
        }
      ]
    })
  ).rejects.toThrow(/Cannot use "parallel" mode because the "plugins" option is not serializable/);
});

test('throws when using parallel with config override', () => {
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      config(cfg) {
        return cfg.options;
      }
    };
  });

  expect(() => customBabelPlugin({ babelHelpers: 'bundled', parallel: true })).toThrow(
    /Cannot use "parallel" mode with a custom "config" override/
  );
});

test('throws when using parallel with result override', () => {
  const customBabelPlugin = createBabelInputPluginFactory(() => {
    return {
      result(result) {
        return result;
      }
    };
  });

  expect(() => customBabelPlugin({ babelHelpers: 'bundled', parallel: true })).toThrow(
    /Cannot use "parallel" mode with a custom "result" override/
  );
});
