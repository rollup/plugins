import { createRequire } from 'module';
import { sep, posix, join } from 'path';
import { fileURLToPath } from 'url';

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

test('async compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(t, bundle);
});

test('fetching WASM from separate file', async (t) => {
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

test('complex module decoding', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(t, bundle);
});

test('sync compiling', async (t) => {
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

test('imports', async (t) => {
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

try {
  // eslint-disable-next-line global-require
  const { Worker } = require('worker_threads');
  test('worker', async (t) => {
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
} catch (err) {
  // worker threads aren't fully supported in Node versions before 11.7.0
}

test('injectHelper', async (t) => {
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

test('target environment auto', async (t) => {
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

test('target environment auto-inline', async (t) => {
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

test('target environment browser', async (t) => {
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

test('target environment node', async (t) => {
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

test('works as CJS plugin', async (t) => {
  t.plan(2);
  const require = createRequire(import.meta.url);
  const wasmPluginCjs = require('current-package');
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPluginCjs()]
  });
  await testBundle(t, bundle);
});
