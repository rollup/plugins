import * as nodePath from 'path';

import test from 'ava';
import { rollup } from 'rollup';
import { SourceMapConsumer } from 'source-map';

import { getCode } from '../../../util/test';

import { getBabelOutputPlugin, createBabelOutputPluginFactory } from '../dist';

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
    ...rollupOptions
  });

  return getCode(bundle, {
    format: 'cjs',
    exports: 'auto',
    plugins: [getBabelOutputPlugin(babelOptions)],
    ...generateOptions
  });
}

test('allows running the plugin on the output via output options', async (t) => {
  const code = await generate('fixtures/basic/main.js', {
    presets: ['@babel/env']
  });
  t.false(code.includes('const'));
});

test('ignores .babelrc when transforming the output by default', async (t) => {
  const code = await generate('fixtures/basic/main.js');
  t.true(code.includes('const'));
});

test("allows transform-runtime to be used with `useESModules: false` (the default) and `format: 'cjs'`", async (t) => {
  const code = await generate(
    'fixtures/runtime-helpers/main.js',
    {
      presets: ['@babel/env'],
      plugins: [['@babel/transform-runtime', { useESModules: false }]]
    },
    { format: 'cjs' }
  );
  t.is(
    code,
    `'use strict';

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

module.exports = Foo;
`
  );
});

test("allows transform-runtime to be used with `useESModules: true` and `format: 'esm'`", async (t) => {
  const code = await generate(
    'fixtures/runtime-helpers/main.js',
    {
      presets: ['@babel/env'],
      plugins: [['@babel/transform-runtime', { useESModules: true }]]
    },
    { format: 'esm' }
  );
  t.is(
    code,
    `import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";

var Foo = function Foo() {
  _classCallCheck(this, Foo);
};

export default Foo;
`
  );
});

test('generates sourcemap by default', async (t) => {
  const bundle = await rollup({ input: 'fixtures/class/main.js' });

  const {
    output: [{ code, map }]
  } = await bundle.generate({
    format: 'cjs',
    exports: 'auto',
    plugins: [getBabelOutputPlugin()],
    sourcemap: true
  });

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

test('allows using external-helpers plugin even if the externalHelpers flag is not passed', async (t) => {
  const warnings = [];
  const code = await generate(
    'fixtures/external-helpers/main.js',
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
  t.deepEqual(warnings, []);
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

test('warns when using the "include" option', async (t) => {
  const warnings = [];
  await generate(
    'fixtures/basic/main.js',
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
  t.deepEqual(warnings, [
    'The "include", "exclude" and "extensions" options are ignored when transforming the output.'
  ]);
});

test('transforms all chunks in a code-splitting setup', async (t) => {
  const bundle = await rollup({ input: 'fixtures/chunks/main.js' });
  const output = await getCode(
    bundle,
    {
      format: 'esm',
      plugins: [
        getBabelOutputPlugin({
          plugins: ['@babel/syntax-dynamic-import'],
          presets: ['@babel/env']
        })
      ]
    },
    true
  );

  t.deepEqual(
    output.map(({ code }) => code),
    [
      `import('./dep-525a96b3.js').then(function (result) {
  return console.log(result);
});
`,
      `var dep = function dep() {
  return 42;
};

export default dep;
`
    ]
  );
});

test('transforms all chunks when preserving modules', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/preserve-modules/main.js',
    preserveModules: true
  });
  const output = await getCode(
    bundle,
    {
      format: 'esm',
      plugins: [
        getBabelOutputPlugin({
          presets: ['@babel/env']
        })
      ]
    },
    true
  );

  t.deepEqual(
    output.map(({ code }) => code),
    [
      `import getResult from './dep.js';
var value = 42;
console.log(getResult(value));
`,
      `var getResult = function getResult(value) {
  return value + 1;
};

export default getResult;
`
    ]
  );
});

test('supports customizing the loader', async (t) => {
  const expectedRollupContextKeys = ['getModuleIds', 'emitFile', 'resolve', 'parse'];
  const customBabelPlugin = createBabelOutputPluginFactory(() => {
    return {
      config(cfg) {
        t.true(typeof this === 'object', 'override config this context is rollup context');
        expectedRollupContextKeys.forEach((key) => {
          t.true(
            Object.keys(this).includes(key),
            `override config this context is rollup context with key ${key}`
          );
        });
        return Object.assign({}, cfg.options, {
          plugins: [
            ...(cfg.options.plugins || []),

            // Include a custom plugin in the options.
            [replaceConsoleLogProperty, { replace: 'foobaz' }]
          ]
        });
      },
      result(result) {
        t.true(typeof this === 'object', 'override result this context is rollup context');
        expectedRollupContextKeys.forEach((key) => {
          t.true(
            Object.keys(this).includes(key),
            `override result this context is rollup context with key ${key}`
          );
        });
        return Object.assign({}, result, {
          code: `${result.code}\n// Generated by some custom loader`
        });
      }
    };
  });
  const bundle = await rollup({ input: 'fixtures/basic/main.js' });
  const code = await getCode(bundle, { format: 'cjs', plugins: [customBabelPlugin()] });

  t.true(code.includes('// Generated by some custom loader'), 'adds the custom comment');
  t.true(code.includes('console.foobaz'), 'runs the plugin');
});

test('throws when using a Rollup output format other than esm or cjs', async (t) => {
  await t.throwsAsync(() => generate('fixtures/basic/main.js', {}, { format: 'iife' }), {
    message: `Using Babel on the generated chunks is strongly discouraged for formats other than "esm" or "cjs" as it can easily break wrapper code and lead to accidentally created global variables. Instead, you should set "output.format" to "esm" and use Babel to transform to another format, e.g. by adding "presets: [['@babel/env', { modules: 'umd' }]]" to your Babel options. If you still want to proceed, add "allowAllFormats: true" to your plugin options.`
  });
});

test('allows using a Rollup output format other than esm or cjs with allowAllFormats', async (t) => {
  const code = await generate(
    'fixtures/basic/main.js',
    { presets: ['@babel/env'], allowAllFormats: true },
    { format: 'iife' }
  );
  t.is(
    code,
    `(function () {
  'use strict';

  var answer = 42;
  console.log("the answer is ".concat(answer));
})();
`
  );
});

test('allows using Babel to transform to other formats', async (t) => {
  const code = await generate(
    'fixtures/basic/main.js',
    { presets: [['@babel/env', { modules: 'umd' }]] },
    { format: 'esm' }
  );
  t.is(
    code,
    `(function (global, factory) {
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
`
  );
});

test('loads configuration files when configFile is passed', async (t) => {
  const code = await generate('fixtures/config-file/main.js', {
    configFile: nodePath.resolve(__dirname, 'fixtures/config-file/config.json')
  });
  t.is(
    code,
    `'use strict';

const answer = Math.pow(42, 2);
console.log(\`the answer is \${answer}\`);
`
  );
});
