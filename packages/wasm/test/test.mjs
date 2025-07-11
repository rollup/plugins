import { createRequire } from 'module';
import { sep, posix, join } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

import { rollup } from 'rollup';
import globby from 'globby';
import test from 'ava';
import del from 'del';

import wasmPlugin from 'current-package';

import { getCode } from '../../../util/test.js';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));
process.chdir(DIRNAME);

const outputFile = './output/bundle.js';
const outputDir = './output/';

const testBundle = async (t, bundle) => {
  const code = await getCode(bundle);
  const func = new AsyncFunction('t', `let result;\n\n${code}\n\nreturn result;`);
  return func(t);
};

test.skip('async compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(t, bundle);
});

test.skip('fetching WASM from separate file', async (t) => {
  t.plan(3);

  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [
      wasmPlugin({
        maxFileSize: 0
      })
    ]
  });

  await bundle.write({ format: 'cjs', file: outputFile });
  const glob = join(outputDir, `**/*.wasm`).split(sep).join(posix.sep);

  global.result = null;
  global.t = t;
  await import(outputFile);
  await global.result;
  t.snapshot(await globby(glob));
  await del(outputDir);
});

test.skip('complex module decoding', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(t, bundle);
});

test.skip('sync compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/sync.js',
    plugins: [
      wasmPlugin({
        sync: ['fixtures/sample.wasm']
      })
    ]
  });
  await testBundle(t, bundle);
});

test.skip('imports', async (t) => {
  t.plan(1);

  const bundle = await rollup({
    input: 'fixtures/imports.js',
    plugins: [
      wasmPlugin({
        sync: ['fixtures/imports.wasm']
      })
    ]
  });
  await testBundle(t, bundle);
});

test.skip('worker', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/worker.js',
    plugins: [wasmPlugin()]
  });
  const code = await getCode(bundle);
  const executeWorker = () => {
    const worker = new Worker(code, { eval: true });
    return new Promise((resolve, reject) => {
      worker.on('error', (err) => reject(err));
      worker.on('exit', (exitCode) => resolve(exitCode));
    });
  };
  await t.notThrowsAsync(async () => {
    const result = await executeWorker();
    t.true(result === 0);
  });
});

test.skip('injectHelper', async (t) => {
  t.plan(4);

  const injectImport = `import { _loadWasmModule } from ${JSON.stringify('\0wasmHelpers.js')};`;

  const bundle = await rollup({
    input: 'fixtures/injectHelper.js',
    plugins: [
      wasmPlugin({
        sync: ['fixtures/sample.wasm']
      }),
      {
        name: 'test-detect',
        transform: (code, id) => {
          if (id.endsWith('sample.wasm')) {
            t.true(code.includes(injectImport));
          }
          if (id.endsWith('foo.js')) {
            t.true(!code.includes(injectImport));
          }
          return code;
        }
      }
    ]
  });
  await testBundle(t, bundle);
});

test.skip('target environment auto', async (t) => {
  t.plan(5);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin({ targetEnv: 'auto' })]
  });
  const code = await getCode(bundle);
  await testBundle(t, bundle);
  t.true(code.includes(`require("fs")`));
  t.true(code.includes(`require("path")`));
  t.true(code.includes(`fetch`));
});

test.skip('target environment auto-inline', async (t) => {
  t.plan(6);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin({ targetEnv: 'auto-inline' })]
  });
  const code = await getCode(bundle);
  await testBundle(t, bundle);
  t.true(!code.includes(`require("fs")`));
  t.true(!code.includes(`require("path")`));
  t.true(!code.includes(`fetch`));
  t.true(code.includes(`if (isNode)`));
});

test.skip('target environment browser', async (t) => {
  t.plan(4);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin({ targetEnv: 'browser' })]
  });
  const code = await getCode(bundle);
  await testBundle(t, bundle);
  t.true(!code.includes(`require("`));
  t.true(code.includes(`fetch`));
});

test.skip('target environment node', async (t) => {
  t.plan(4);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin({ targetEnv: 'node' })]
  });
  const code = await getCode(bundle);
  await testBundle(t, bundle);
  t.true(code.includes(`require("`));
  t.true(!code.includes(`fetch`));
});

test.skip('filename override', async (t) => {
  t.plan(1);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({ maxFileSize: 0, targetEnv: 'node', fileName: 'start-[name]-suffix[extname]' })
    ]
  });

  await bundle.write({ format: 'cjs', file: 'override/bundle.js' });
  const glob = join('override', `start-sample-suffix.wasm`).split(sep).join(posix.sep);
  await import(outputFile);
  t.snapshot(await globby(glob));
  await del('override');
});

test.skip('works as CJS plugin', async (t) => {
  t.plan(2);
  const require = createRequire(import.meta.url);
  const wasmPluginCjs = require('current-package');
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPluginCjs()]
  });
  await testBundle(t, bundle);
});

// WPT test harness function
const testWptBundle = async (t, bundle) => {
  const code = await getCode(bundle, {
    format: 'esm',
    inlineDynamicImports: true
  });
  console.log(code);

  // WPT test harness functions that wrap Ava assertions
  const promiseTest = async (fn, name) => {
    try {
      await fn();
      t.pass(name);
    } catch (err) {
      t.fail(`${name}: ${err.message}`);
    }
  };

  const assertArrayEquals = (actual, expected, message) => {
    t.deepEqual(actual, expected, message);
  };

  const assertTrue = (condition, message) => {
    t.true(condition, message);
  };

  const assertFalse = (condition, message) => {
    t.false(condition, message);
  };

  const assertEquals = (actual, expected, message) => {
    t.is(actual, expected, message);
  };

  const assertThrowsJs = (errorType, fn, message) => {
    t.throws(fn, { instanceOf: errorType }, message);
  };

  const assertNotEquals = (actual, expected, message) => {
    t.not(actual, expected, message);
  };

  // Run the test in an async function with the harness
  const func = new AsyncFunction(
    't',
    'promise_test',
    'assert_array_equals',
    'assert_true',
    'assert_false',
    'assert_equals',
    'assert_throws_js',
    'assert_not_equals',
    code
  );

  try {
    await func(
      t,
      promiseTest,
      assertArrayEquals,
      assertTrue,
      assertFalse,
      assertEquals,
      assertThrowsJs,
      assertNotEquals
    );
  } catch (err) {
    t.fail(`Test execution failed: ${err.message}`);
  }
};

// WPT jsapi ESM integration tests
const wptTests = [
  'exports.tentative.any.js'
  // 'global-exports-live-bindings.tentative.any.js',
  // 'global-exports.tentative.any.js',
  // 'js-wasm-cycle.tentative.any.js',
  // 'mutable-global-sharing.tentative.any.js',
  // 'namespace-instance.tentative.any.js',
  // 'reserved-import-names.tentative.any.js',
  // 'resolve-export.tentative.any.js',
  // 'source-phase-string-builtins.tentative.any.js',
  // 'source-phase.tentative.any.js',
  // 'string-builtins.tentative.any.js',
  // 'v128-tdz.tentative.any.js',
  // 'wasm-import-wasm-export.tentative.any.js'
];

// Generate tests for each WPT file
wptTests.forEach((testFile) => {
  const testName = testFile.replace('.tentative.any.js', '');
  test(`WPT jsapi/${testName}`, async (t) => {
    const bundle = await rollup({
      input: `fixtures/jsapi/${testFile}`,
      plugins: [wasmPlugin()]
    });
    await testWptBundle(t, bundle);
  });
});

// uncaught exception will cause test failures on this node version.
if (!process.version.startsWith('v14')) {
  test.skip('avoid uncaught exception on file read', async (t) => {
    t.plan(2);

    const bundle = await rollup({
      input: 'fixtures/complex.js',
      plugins: [wasmPlugin({ maxFileSize: 0, targetEnv: 'node' })]
    });

    const raw = await getCode(bundle);
    const code = raw.replace('.wasm', '-does-not-exist.wasm');

    const executeWorker = () => {
      const worker = new Worker(`let result; ${code}`, { eval: true });
      return new Promise((resolve, reject) => {
        worker.on('error', (err) => reject(err));
        worker.on('exit', (exitCode) => resolve(exitCode));
      });
    };

    const err = await t.throwsAsync(() => executeWorker());
    t.regex(err.message, /no such file or directory/);
  });
}
