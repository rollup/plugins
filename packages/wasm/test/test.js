import { sep, posix, join } from 'path';

import { rollup } from 'rollup';
import globby from 'globby';
import test from 'ava';
import del from 'del';

import { getCode } from '../../../util/test';

import wasm from '../';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

process.chdir(__dirname);

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
    plugins: [wasm()]
  });
  await testBundle(t, bundle);
});

test('fetching WASM from separate file', async (t) => {
  t.plan(3);

  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [
      wasm({
        maxFileSize: 0
      })
    ]
  });

  await bundle.write({ format: 'cjs', file: outputFile });
  const glob = join(outputDir, `**/*.wasm`).split(sep).join(posix.sep);

  global.result = null;
  global.t = t;
  // eslint-disable-next-line global-require, import/no-dynamic-require
  require(outputFile);

  await global.result;
  t.snapshot(await globby(glob));
  await del(outputDir);
});

test('complex module decoding', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [wasm()]
  });
  await testBundle(t, bundle);
});

test('sync compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'fixtures/sync.js',
    plugins: [
      wasm({
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
      wasm({
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
      plugins: [wasm()]
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
      wasm({
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
