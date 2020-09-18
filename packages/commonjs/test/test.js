/* eslint-disable line-comment-position, no-new-func, no-undefined */
import * as path from 'path';

import test from 'ava';
import { SourceMapConsumer } from 'source-map';
import { install } from 'source-map-support';
import { getLocator } from 'locate-character';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';

import { testBundle } from '../../../util/test';

import { commonjs, executeBundle, getCodeFromBundle } from './helpers/util';

install();

process.chdir(__dirname);

// most of these should be moved over to function...
test('generates a sourcemap', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/sourcemap/main.js',
    plugins: [commonjs({ sourceMap: true })]
  });

  const {
    output: [{ code, map }]
  } = await bundle.generate({
    exports: 'auto',
    format: 'cjs',
    sourcemap: true,
    sourcemapFile: path.resolve('bundle.js')
  });

  const smc = await new SourceMapConsumer(map);
  const locator = getLocator(code, { offsetLine: 1 });

  let generatedLoc = locator('42');
  let loc = smc.originalPositionFor(generatedLoc); // 42
  t.is(loc.source, 'fixtures/samples/sourcemap/foo.js');
  t.is(loc.line, 1);
  t.is(loc.column, 15);

  generatedLoc = locator('log');
  loc = smc.originalPositionFor(generatedLoc); // log
  t.is(loc.source, 'fixtures/samples/sourcemap/main.js');
  t.is(loc.line, 3);
  t.is(loc.column, 8);
});

test('supports an array of multiple entry points', async (t) => {
  const bundle = await rollup({
    input: [
      'fixtures/samples/multiple-entry-points/b.js',
      'fixtures/samples/multiple-entry-points/c.js'
    ],
    plugins: [commonjs()]
  });

  const { output } = await bundle.generate({
    exports: 'auto',
    format: 'cjs',
    chunkFileNames: '[name].js'
  });
  if (Array.isArray(output)) {
    t.is(output.length, 3);
    t.truthy(output.find(({ fileName }) => fileName === 'b.js'));
    t.truthy(output.find(({ fileName }) => fileName === 'c.js'));
  } else {
    t.is(Object.keys(output).length, 3);
    t.is('b.js' in output, true);
    t.is('c.js' in output, true);
  }
});

test('supports an object of multiple entry points', async (t) => {
  const bundle = await rollup({
    input: {
      b: require.resolve('./fixtures/samples/multiple-entry-points/b.js'),
      c: require.resolve('./fixtures/samples/multiple-entry-points/c.js')
    },
    plugins: [resolve(), commonjs()]
  });

  const { output } = await bundle.generate({
    exports: 'auto',
    format: 'cjs',
    chunkFileNames: '[name].js'
  });

  if (Array.isArray(output)) {
    t.is(output.length, 3);
    t.truthy(output.find(({ fileName }) => fileName === 'b.js'));
    t.truthy(output.find(({ fileName }) => fileName === 'c.js'));
  } else {
    t.is(Object.keys(output).length, 3);
    t.is('b.js' in output, true);
    t.is('c.js' in output, true);
  }
});

test('handles references to `global`', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/global/main.js',
    plugins: [commonjs()]
  });

  const code = await getCodeFromBundle(bundle);

  const mockWindow = {};
  const mockGlobal = {};
  const mockSelf = {};

  const fn = new Function('module', 'globalThis', 'window', 'global', 'self', code);

  fn({}, undefined, mockWindow, mockGlobal, mockSelf);
  t.is(mockWindow.foo, 'bar', code);
  t.is(mockGlobal.foo, undefined, code);
  t.is(mockSelf.foo, undefined, code);

  fn({}, undefined, undefined, mockGlobal, mockSelf);
  t.is(mockGlobal.foo, 'bar', code);
  t.is(mockSelf.foo, undefined, code);

  fn({}, undefined, undefined, undefined, mockSelf);
  t.is(mockSelf.foo, 'bar', code);
});

test('handles multiple references to `global`', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/global-in-if-block/main.js',
    plugins: [commonjs()]
  });

  const code = await getCodeFromBundle(bundle);
  const fn = new Function('module', 'exports', 'globalThis', code);
  const module = { exports: {} };
  const globalThis = {};

  fn(module, module.exports, globalThis);
  t.is(globalThis.count, 1);

  fn(module, module.exports, globalThis);
  t.is(globalThis.count, 2);
});

test('handles transpiled CommonJS modules', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/corejs/literal-with-default.js',
    plugins: [commonjs()]
  });

  const code = await getCodeFromBundle(bundle);
  const module = { exports: {} };

  const fn = new Function('module', 'exports', code);
  fn(module, module.exports);

  t.is(module.exports, 'foobar', code);
});

test('handles successive builds', async (t) => {
  const plugin = commonjs();
  let bundle = await rollup({
    input: 'fixtures/samples/corejs/literal-with-default.js',
    plugins: [plugin]
  });
  await bundle.generate({
    exports: 'auto',
    format: 'cjs'
  });

  bundle = await rollup({
    input: 'fixtures/samples/corejs/literal-with-default.js',
    plugins: [plugin]
  });
  const code = await getCodeFromBundle(bundle);

  const module = { exports: {} };

  const fn = new Function('module', 'exports', code);
  fn(module, module.exports);

  t.is(module.exports, 'foobar', code);
});

test.serial('handles symlinked node_modules with preserveSymlinks: false', (t) => {
  const cwd = process.cwd();

  // ensure we resolve starting from a directory with
  // symlinks in node_modules.

  process.chdir('fixtures/samples/symlinked-node-modules');

  return t.notThrowsAsync(
    rollup({
      input: './index.js',
      onwarn(warning) {
        // should not get a warning about unknown export 'foo'
        throw new Error(`Unexpected warning: ${warning.message}`);
      },
      plugins: [
        resolve({
          preserveSymlinks: false,
          preferBuiltins: false
        }),
        commonjs()
      ]
    })
      .then((v) => {
        process.chdir(cwd);
        return v;
      })
      .catch((err) => {
        process.chdir(cwd);
        throw err;
      })
  );
});

test('converts a CommonJS module with custom file extension', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/extension/main.coffee',
    plugins: [commonjs({ extensions: ['.coffee'] })]
  });

  t.is((await executeBundle(bundle, t)).exports, 42);
});

test('identifies named exports from object literals', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/named-exports-from-object-literal/main.js',
    plugins: [commonjs()]
  });

  t.plan(3);
  await testBundle(t, bundle);
});

test('can ignore references to `global`', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/ignore-global/main.js',
    plugins: [commonjs({ ignoreGlobal: true })],
    onwarn: (warning) => {
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      // eslint-disable-next-line no-console
      console.warn(warning.message);
    }
  });

  const code = await getCodeFromBundle(bundle);
  const { exports, global } = await executeBundle(bundle, t);

  t.is(exports.immediate1, global.setImmediate, code);
  t.is(exports.immediate2, global.setImmediate, code);
  t.is(exports.immediate3, null, code);
});

test('can handle parens around right have node while producing default export', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/paren-expression/index.js',
    plugins: [commonjs()]
  });

  t.is((await executeBundle(bundle, t)).exports, 42);
});

test('typeof transforms: correct-scoping', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/umd/correct-scoping.js',
    plugins: [commonjs()]
  });

  t.is((await executeBundle(bundle, t)).exports, 'object');
});

test('typeof transforms: protobuf', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/umd/protobuf.js',
    external: ['bytebuffer'],
    plugins: [commonjs()]
  });

  t.is((await executeBundle(bundle, t)).exports, true);
});

test('typeof transforms: sinon', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/umd/sinon.js',
    plugins: [commonjs()]
  });

  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.is(code.indexOf('typeof require'), -1, code);
  // t.not( code.indexOf( 'typeof module' ), -1, code ); // #151 breaks this test
  // t.not( code.indexOf( 'typeof define' ), -1, code ); // #144 breaks this test
});

test('deconflicts helper name', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/deconflict-helpers/main.js',
    plugins: [commonjs()]
  });

  const { exports } = await executeBundle(bundle, t);
  t.not(exports, 'nope');
});

test('deconflicts reserved keywords', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/reserved-as-property/main.js',
    plugins: [commonjs()]
  });

  const reservedProp = (await executeBundle(bundle, t)).exports.delete;
  t.is(reservedProp, 'foo');
});

test('does not process the entry file when it has a leading "." (issue #63)', async (t) => {
  const bundle = await rollup({
    input: './fixtures/function/basic/main.js',
    plugins: [commonjs()]
  });

  await t.notThrowsAsync(executeBundle(bundle, t));
});

test('respects other plugins', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/other-transforms/main.js',
    plugins: [
      {
        transform(code, id) {
          if (id[0] === '\0') return null;
          return code.replace('40', '41');
        }
      },
      commonjs()
    ]
  });

  await t.notThrowsAsync(executeBundle(bundle, t));
});

test('rewrites top-level defines', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/define-is-undefined/main.js',
    plugins: [commonjs()]
  });

  function define() {
    throw new Error('nope');
  }

  define.amd = true;

  const { exports } = await executeBundle(bundle, t, { context: { define } });
  t.is(exports, 42);
});

test('respects options.external', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/external/main.js',
    plugins: [resolve(), commonjs()],
    external: ['baz']
  });

  const code = await getCodeFromBundle(bundle);
  t.is(code.indexOf('hello'), -1);

  const { exports } = await executeBundle(bundle, t);
  t.is(exports, 'HELLO');
});

test('prefers to set name using directory for index files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/rename-index/main.js',
    plugins: [commonjs()]
  });

  const code = await getCodeFromBundle(bundle);
  t.is(code.indexOf('var index'), -1);
  t.not(code.indexOf('var invalidVar'), -1);
  t.not(code.indexOf('var validVar'), -1);
  t.not(code.indexOf('var nonIndex'), -1);
});

test('does not warn even if the ES module does not export "default"', async (t) => {
  const warns = [];
  await rollup({
    input: 'fixtures/samples/es-modules-without-default-export/main.js',
    plugins: [commonjs()],
    onwarn: (warn) => warns.push(warn)
  });
  t.is(warns.length, 0);

  await rollup({
    input: 'fixtures/function/bare-import/bar.js',
    plugins: [commonjs()],
    onwarn: (warn) => warns.push(warn)
  });
  t.is(warns.length, 0);

  await rollup({
    input: 'fixtures/function/bare-import-comment/main.js',
    plugins: [commonjs()],
    onwarn: (warn) => warns.push(warn)
  });
  t.is(warns.length, 0);
});

test('compiles with cache', async (t) => {
  // specific commonjs require() to ensure same instance is used
  // eslint-disable-next-line global-require
  const commonjsInstance = require('../dist/index');

  const bundle = await rollup({
    input: 'fixtures/function/index/main.js',
    plugins: [commonjsInstance()]
  });

  await t.notThrowsAsync(
    rollup({
      input: 'fixtures/function/index/main.js',
      plugins: [commonjsInstance()],
      cache: bundle
    })
  );
});

test('creates an error with a code frame when parsing fails', async (t) => {
  try {
    await rollup({
      input: 'fixtures/samples/invalid-syntax/main.js',
      plugins: [commonjs()]
    });
  } catch (error) {
    t.is(
      error.frame,
      '1: /* eslint-disable */\n2: export const foo = 2,\n                        ^'
    );
  }
});

// Virtual modules are treated as "requireReturnsDefault: 'always'" to avoid interop
test('ignores virtual modules', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/ignore-virtual-modules/main.js',
    plugins: [
      commonjs(),
      {
        resolveId(id) {
          if (id === '\0virtual' || id === '\0resolved-virtual') {
            return '\0resolved-virtual';
          }
          return null;
        },
        load(id) {
          if (id === '\0resolved-virtual') {
            return 'export default "Virtual export"';
          }
          return null;
        }
      }
    ]
  });
  t.is((await executeBundle(bundle, t)).exports, 'Virtual export');
});

test('does not produce warnings when importing .mjs without default export', async (t) => {
  const bundle = await rollup({
    input: 'main.mjs',
    onwarn(warning) {
      // The interop should not trigger a "default is not exported" warning
      throw new Error(`Unexpected warning: ${warning.message}`);
    },
    plugins: [
      commonjs(),
      {
        load(id) {
          if (id === 'main.mjs') {
            return 'import cjs from "cjs.js"; export default cjs;';
          }
          if (id === 'cjs.js') {
            // CJS libraries expect to receive a CJS file here
            return 'module.exports = require("fromNodeModules");';
          }
          if (id === 'fromNodeModules.mjs') {
            return 'export const result = "from esm";';
          }
          return null;
        },
        resolveId(id) {
          // rollup-plugin-node-resolve usually prefers ESM versions
          if (id === 'fromNodeModules') {
            return 'fromNodeModules.mjs';
          }
          return id;
        }
      }
    ]
  });
  t.deepEqual((await executeBundle(bundle, t)).exports, { result: 'from esm' });
});

test('produces optimized code when importing esm with a known default export', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    plugins: [
      commonjs({ requireReturnsDefault: true }),
      {
        load(id) {
          if (id === 'main.js') {
            return 'module.exports = require("esm.js")';
          }
          if (id === 'esm.js') {
            return 'export const ignored = "ignored"; export default "default"';
          }
          return null;
        },
        resolveId(id) {
          return id;
        }
      }
    ]
  });
  const code = await getCodeFromBundle(bundle);
  t.is(
    code,
    `'use strict';

var require$$0 = "default";

var main = require$$0;

module.exports = main;
`
  );
});

test('produces optimized code when importing esm without a default export', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    plugins: [
      commonjs(),
      {
        load(id) {
          if (id === 'main.js') {
            return 'module.exports = require("esm.js")';
          }
          if (id === 'esm.js') {
            return 'export const value = "value";';
          }
          return null;
        },
        resolveId(id) {
          return id;
        }
      }
    ]
  });
  const code = await getCodeFromBundle(bundle);
  t.is(
    code,
    `'use strict';

const value = "value";

var esm = /*#__PURE__*/Object.freeze({
	__proto__: null,
	value: value
});

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var require$$0 = /*@__PURE__*/getAugmentedNamespace(esm);

var main = require$$0;

module.exports = main;
`
  );
});

test('handles array destructuring assignment', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/array-destructuring-assignment/main.js',
    plugins: [commonjs({ sourceMap: true })]
  });

  const code = await getCodeFromBundle(bundle, { exports: 'named' });
  t.is(
    code,
    `'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/* eslint-disable */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

var shuffleArray_1 = shuffleArray;

var main = {
	shuffleArray: shuffleArray_1
};

exports.default = main;
exports.shuffleArray = shuffleArray_1;
`
  );
});

test('can spread an object into module.exports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/module-exports-spread/main.js',
    plugins: [commonjs()]
  });
  const code = await getCodeFromBundle(bundle);
  t.snapshot(code);
});

test('logs a warning when the deprecated namedExports option is used', async (t) => {
  let message;
  const bundle = await rollup({
    onwarn(warning) {
      ({ message } = warning);
    },
    input: 'fixtures/samples/sourcemap/main.js',
    plugins: [commonjs({ namedExports: { foo: ['bar'] } })]
  });

  await getCodeFromBundle(bundle);
  t.is(
    message,
    'The namedExports option from "@rollup/plugin-commonjs" is deprecated. Named exports are now handled automatically.'
  );
});

test('imports .cjs file extension by default', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/samples/cjs-extension/main.js',
    plugins: [commonjs()]
  });
  const code = await getCodeFromBundle(bundle);
  t.snapshot(code);
});
