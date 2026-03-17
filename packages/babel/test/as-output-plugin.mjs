import * as nodePath from 'path';
import { fileURLToPath } from 'url';

import { test, expect } from 'vitest';
import { rollup } from 'rollup';

import { getBabelOutputPlugin, createBabelOutputPluginFactory } from 'current-package';

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
    ...rollupOptions
  });
  return getCode(bundle, {
    format: 'cjs',
    exports: 'auto',
    plugins: [getBabelOutputPlugin(babelOptions)],
    ...generateOptions
  });
}
test('allows running the plugin on the output via output options', async () => {
  const code = await generate('basic/main.js', {
    presets: ['@babel/env']
  });
  expect(code.includes('const')).toBe(false);
});
test('ignores .babelrc when transforming the output by default', async () => {
  const code = await generate('basic/main.js');
  expect(code.includes('const')).toBe(true);
});
test("allows transform-runtime to be used with `useESModules: false` (the default) and `format: 'cjs'`", async () => {
  const code = await generate(
    'runtime-helpers/main.js',
    {
      presets: ['@babel/env'],
      plugins: [
        [
          '@babel/transform-runtime',
          {
            useESModules: false
          }
        ]
      ]
    },
    {
      format: 'cjs'
    }
  );
  expect(code).toBe(`'use strict';

var _createClass = require("@babel/runtime/helpers/createClass");
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");
var Foo = /*#__PURE__*/_createClass(function Foo() {
  _classCallCheck(this, Foo);
});
module.exports = Foo;
`);
});
test("allows transform-runtime to be used with `useESModules: true` and `format: 'es'`", async () => {
  const code = await generate(
    'runtime-helpers/main.js',
    {
      presets: ['@babel/env'],
      plugins: [
        [
          '@babel/transform-runtime',
          {
            useESModules: true
          }
        ]
      ]
    },
    {
      format: 'es'
    }
  );
  expect(code).toBe(`import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
var Foo = /*#__PURE__*/_createClass(function Foo() {
  _classCallCheck(this, Foo);
});
export { Foo as default };
`);
});
test('generates sourcemap by default', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}class/main.js`
  });
  const {
    output: [{ code, map }]
  } = await bundle.generate({
    format: 'cjs',
    exports: 'auto',
    plugins: [getBabelOutputPlugin()],
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
test('allows using external-helpers plugin even if the externalHelpers flag is not passed', async () => {
  const warnings = [];
  const code = await generate(
    'external-helpers/main.js',
    {
      presets: ['@babel/env'],
      plugins: ['@babel/external-helpers']
    },
    {},
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  expect(warnings).toEqual([]);
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
test('warns when using the "include" option', async () => {
  const warnings = [];
  await generate(
    'basic/main.js',
    {
      include: ['*.js']
    },
    {},
    {
      onwarn(warning) {
        warnings.push(warning.message);
      }
    }
  );
  expect(warnings).toEqual([
    'The "include", "exclude" and "extensions" options are ignored when transforming the output.'
  ]);
});
test('transforms all chunks in a code-splitting setup', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}chunks/main.js`
  });
  const output = await getCode(
    bundle,
    {
      format: 'es',
      plugins: [
        getBabelOutputPlugin({
          plugins: ['@babel/syntax-dynamic-import'],
          presets: ['@babel/env']
        })
      ]
    },
    true
  );
  expect(output.map(({ code }) => code)).toEqual([
    `import('./dep--s88I99N.js').then(function (result) {
  return console.log(result);
});
`,
    `var dep = function dep() {
  return 42;
};
export { dep as default };
`
  ]);
});
test('transforms all chunks when preserving modules', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}preserve-modules/main.js`
  });
  const output = await getCode(
    bundle,
    {
      format: 'es',
      preserveModules: true,
      plugins: [
        getBabelOutputPlugin({
          presets: ['@babel/env']
        })
      ]
    },
    true
  );
  expect(output.map(({ code }) => code)).toEqual([
    `import getResult from './dep.js';
var value = 42;
console.log(getResult(value));
`,
    `var getResult = function getResult(value) {
  return value + 1;
};
export { getResult as default };
`
  ]);
});
test('supports customizing the loader', async () => {
  const expectedRollupContextKeys = ['getModuleIds', 'emitFile', 'resolve', 'parse'];
  const customBabelPlugin = createBabelOutputPluginFactory(() => {
    return {
      config(cfg) {
        expect(typeof this === 'object').toBe(true);
        expectedRollupContextKeys.forEach((key) => {
          expect(Object.keys(this).includes(key)).toBe(true);
        });
        return Object.assign({}, cfg.options, {
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
        });
      },
      result(result) {
        expect(typeof this === 'object').toBe(true);
        expectedRollupContextKeys.forEach((key) => {
          expect(Object.keys(this).includes(key)).toBe(true);
        });
        return Object.assign({}, result, {
          code: `${result.code}\n// Generated by some custom loader`
        });
      }
    };
  });
  const bundle = await rollup({
    input: `${FIXTURES}basic/main.js`
  });
  const code = await getCode(bundle, {
    format: 'cjs',
    plugins: [customBabelPlugin()]
  });
  expect(code.includes('// Generated by some custom loader')).toBe(true);
  expect(code.includes('console.foobaz')).toBe(true);
});
test('throws when using a Rollup output format other than esm or cjs', async () => {
  await expect(
    generate(
      'basic/main.js',
      {},
      {
        format: 'iife'
      }
    )
  ).rejects.toThrow(
    `Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: 'umd' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`
  );
});
test('allows using a Rollup output format other than esm or cjs with allowAllFormats', async () => {
  const code = await generate(
    'basic/main.js',
    {
      presets: ['@babel/env'],
      allowAllFormats: true
    },
    {
      format: 'iife'
    }
  );
  expect(code).toBe(`(function () {
  'use strict';

  var answer = 42;
  console.log("the answer is ".concat(answer));
})();
`);
});
test('allows using Babel to transform to other formats', async () => {
  const code = await generate(
    'basic/main.js',
    {
      presets: [
        [
          '@babel/env',
          {
            modules: 'umd'
          }
        ]
      ]
    },
    {
      format: 'es'
    }
  );
  expect(code).toBe(`(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.unknown = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var answer = 42;
  console.log("the answer is ".concat(answer));
});
`);
});
test('loads configuration files when configFile is passed', async () => {
  const code = await generate('config-file/main.js', {
    configFile: nodePath.resolve(DIRNAME, 'fixtures/config-file/config.json')
  });
  expect(code).toBe(`'use strict';

const answer = Math.pow(42, 2);
console.log(\`the answer is \${answer}\`);
`);
});
test('allows excluding manual chunks from output transform via `excludeChunks`', async () => {
  const bundle = await rollup({
    input: `${FIXTURES}chunks/main.js`
  });
  const output = await getCode(
    bundle,
    {
      format: 'es',
      // eslint-disable-next-line consistent-return
      manualChunks(id) {
        // Place the dependency into a named manual chunk
        if (id.endsWith(`${nodePath.sep}chunks${nodePath.sep}dep.js`)) return 'vendor';
      },
      plugins: [
        getBabelOutputPlugin({
          // Transform generated code but skip the 'vendor' manual chunk
          presets: ['@babel/env'],
          excludeChunks: ['vendor']
        })
      ]
    },
    true
  );
  const codes = output.map(({ code }) => code);
  // The vendor chunk should remain untransformed and contain the arrow function as-is
  // Debug output intentionally omitted
  expect(codes.some((c) => c.includes('=> 42'))).toBe(true);
});

test('works in parallel', async () => {
  const bundle = await rollup({ input: `${FIXTURES}basic/main.js` });
  const code = await getCode(bundle, {
    format: 'es',
    plugins: [
      getBabelOutputPlugin({
        presets: ['@babel/env'],
        parallel: true
      })
    ]
  });
  expect(code.includes('const')).toBe(false);
});

test('works in parallel with specified worker count', async () => {
  const bundle = await rollup({ input: `${FIXTURES}basic/main.js` });
  const code = await getCode(bundle, {
    format: 'es',
    plugins: [
      getBabelOutputPlugin({
        presets: ['@babel/env'],
        parallel: 2
      })
    ]
  });
  expect(code.includes('const')).toBe(false);
});

test('throws when output plugin parallel option is not a positive integer', () => {
  expect(() => getBabelOutputPlugin({ parallel: 0 })).toThrow(/must be true or a positive integer/);
  expect(() => getBabelOutputPlugin({ parallel: -1 })).toThrow(
    /must be true or a positive integer/
  );
});

test('throws when using output plugin parallel with config override', () => {
  const customBabelPlugin = createBabelOutputPluginFactory(() => {
    return {
      config(cfg) {
        return cfg.options;
      }
    };
  });

  expect(() => customBabelPlugin({ parallel: true })).toThrow(
    /Cannot use "parallel" mode with a custom "config" override/
  );
});

test('throws when using output plugin parallel with result override', () => {
  const customBabelPlugin = createBabelOutputPluginFactory(() => {
    return {
      result(result) {
        return result;
      }
    };
  });

  expect(() => customBabelPlugin({ parallel: true })).toThrow(
    /Cannot use "parallel" mode with a custom "result" override/
  );
});
