import { sep, posix, join } from 'path';

import { rollup } from 'rollup';
import globby from 'globby';
import test from 'ava';
import del from 'del';

import { getCode } from '../../../util/test';

import wasm from '../';

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

process.chdir(__dirname);

const outputFile = 'output/bundle.js';
const outputDir = 'output/';

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
  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [
      wasm({
        limit: 0
      })
    ]
  });

  await bundle.write({ format: 'es', file: outputFile });
  const glob = join(outputDir, `**/*.wasm`)
    .split(sep)
    .join(posix.sep);

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
