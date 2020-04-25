import { rollup } from 'rollup';
import test from 'ava';

// eslint-disable-next-line no-unused-vars, import/no-unresolved, import/extensions
import wasm from '../dist/index';

const { Worker } = require('worker_threads');

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

const generateCode = async (bundle) => {
  const { output } = await bundle.generate({ format: 'cjs' });
  const [{ code }] = output;
  return code;
};

const testBundle = async (t, bundle) => {
  const code = await generateCode(bundle);
  const func = new AsyncFunction('t', `let result;\n\n${code}\n\nreturn result;`);
  return func(t);
};

test('async compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'test/fixtures/async.js',
    plugins: [wasm()]
  });
  await testBundle(t, bundle);
});

test('complex module decoding', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'test/fixtures/complex.js',
    plugins: [wasm()]
  });
  await testBundle(t, bundle);
});

test('sync compiling', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'test/fixtures/sync.js',
    plugins: [
      wasm({
        sync: ['test/fixtures/sample.wasm']
      })
    ]
  });
  await testBundle(t, bundle);
});

test('imports', async (t) => {
  t.plan(1);

  const bundle = await rollup({
    input: 'test/fixtures/imports.js',
    plugins: [
      wasm({
        sync: ['test/fixtures/imports.wasm']
      })
    ]
  });
  await testBundle(t, bundle);
});

test('worker', async (t) => {
  t.plan(2);

  const bundle = await rollup({
    input: 'test/fixtures/worker.js',
    plugins: [wasm()]
  });
  const code = await generateCode(bundle);
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
