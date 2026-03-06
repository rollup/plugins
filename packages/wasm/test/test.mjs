import { createRequire } from 'module';
import { sep, posix, join } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';

import { rollup } from 'rollup';
import globby from 'globby';
import { test, expect } from 'vitest';
import del from 'del';

import wasmPlugin from 'current-package';

import { getCode } from '../../../util/test.js';

const avaAssertions = {
  is(actual, expected) {
    expect(actual).toBe(expected);
  }
};
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
test('async compiling', async () => {
  expect.assertions(2);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(avaAssertions, bundle);
});
test('fetching WASM from separate file', async () => {
  expect.assertions(3);
  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [
      wasmPlugin({
        maxFileSize: 0
      })
    ]
  });
  await bundle.write({
    format: 'cjs',
    file: outputFile
  });
  const glob = join(outputDir, `**/*.wasm`).split(sep).join(posix.sep);
  global.result = null;
  global.t = avaAssertions;
  await import(outputFile);
  await global.result;
  expect(await globby(glob)).toMatchSnapshot();
  await del(outputDir);
});
test('complex module decoding', async () => {
  expect.assertions(2);
  const bundle = await rollup({
    input: 'fixtures/complex.js',
    plugins: [wasmPlugin()]
  });
  await testBundle(avaAssertions, bundle);
});
test('sync compiling', async () => {
  expect.assertions(2);
  const bundle = await rollup({
    input: 'fixtures/sync.js',
    plugins: [
      wasmPlugin({
        sync: ['fixtures/sample.wasm']
      })
    ]
  });
  await testBundle(avaAssertions, bundle);
});
test('imports', async () => {
  expect.assertions(1);
  const bundle = await rollup({
    input: 'fixtures/imports.js',
    plugins: [
      wasmPlugin({
        sync: ['fixtures/imports.wasm']
      })
    ]
  });
  await testBundle(avaAssertions, bundle);
});
test('worker', async () => {
  expect.assertions(2);
  const bundle = await rollup({
    input: 'fixtures/worker.js',
    plugins: [wasmPlugin()]
  });
  const code = await getCode(bundle);
  const executeWorker = () => {
    const worker = new Worker(code, {
      eval: true
    });
    return new Promise((resolve, reject) => {
      worker.on('error', (err) => reject(err));
      worker.on('exit', (exitCode) => resolve(exitCode));
    });
  };
  let error;
  let result;
  try {
    result = await executeWorker();
  } catch (err) {
    error = err;
  }
  expect(error).toBeUndefined();
  expect(result).toBe(0);
});
test('injectHelper', async () => {
  expect.assertions(4);
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
            expect(code.includes(injectImport)).toBe(true);
          }
          if (id.endsWith('foo.js')) {
            expect(!code.includes(injectImport)).toBe(true);
          }
          return code;
        }
      }
    ]
  });
  await testBundle(avaAssertions, bundle);
});
test('target environment auto', async () => {
  expect.assertions(5);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({
        targetEnv: 'auto'
      })
    ]
  });
  const code = await getCode(bundle);
  await testBundle(avaAssertions, bundle);
  expect(code.includes(`require("fs")`)).toBe(true);
  expect(code.includes(`require("path")`)).toBe(true);
  expect(code.includes(`fetch`)).toBe(true);
});
test('target environment auto-inline', async () => {
  expect.assertions(6);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({
        targetEnv: 'auto-inline'
      })
    ]
  });
  const code = await getCode(bundle);
  await testBundle(avaAssertions, bundle);
  expect(!code.includes(`require("fs")`)).toBe(true);
  expect(!code.includes(`require("path")`)).toBe(true);
  expect(!code.includes(`fetch`)).toBe(true);
  expect(code.includes(`if (isNode)`)).toBe(true);
});
test('target environment browser', async () => {
  expect.assertions(4);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({
        targetEnv: 'browser'
      })
    ]
  });
  const code = await getCode(bundle);
  await testBundle(avaAssertions, bundle);
  expect(!code.includes(`require("`)).toBe(true);
  expect(code.includes(`fetch`)).toBe(true);
});
test('target environment node', async () => {
  expect.assertions(4);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({
        targetEnv: 'node'
      })
    ]
  });
  const code = await getCode(bundle);
  await testBundle(avaAssertions, bundle);
  expect(code.includes(`require("`)).toBe(true);
  expect(!code.includes(`fetch`)).toBe(true);
});
test('filename override', async () => {
  expect.assertions(1);
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [
      wasmPlugin({
        maxFileSize: 0,
        targetEnv: 'node',
        fileName: 'start-[name]-suffix[extname]'
      })
    ]
  });
  await bundle.write({
    format: 'cjs',
    file: 'override/bundle.js'
  });
  const glob = join('override', `start-sample-suffix.wasm`).split(sep).join(posix.sep);
  await import(outputFile);
  expect(await globby(glob)).toMatchSnapshot();
  await del('override');
});
test('works as CJS plugin', async () => {
  expect.assertions(2);
  const require = createRequire(import.meta.url);
  const wasmPluginCjs = require('current-package');
  const bundle = await rollup({
    input: 'fixtures/async.js',
    plugins: [wasmPluginCjs()]
  });
  await testBundle(avaAssertions, bundle);
});

// uncaught exception will cause test failures on this node version.
if (!process.version.startsWith('v14')) {
  test('avoid uncaught exception on file read', async () => {
    expect.assertions(2);
    const bundle = await rollup({
      input: 'fixtures/complex.js',
      plugins: [
        wasmPlugin({
          maxFileSize: 0,
          targetEnv: 'node'
        })
      ]
    });
    const raw = await getCode(bundle);
    const code = raw.replace('.wasm', '-does-not-exist.wasm');
    const executeWorker = () => {
      const worker = new Worker(`let result; ${code}`, {
        eval: true
      });
      return new Promise((resolve, reject) => {
        worker.on('error', (err) => reject(err));
        worker.on('exit', (exitCode) => resolve(exitCode));
      });
    };
    const err = await executeWorker().catch((error) => error);
    expect(err).toBeDefined();
    expect(err.message).toMatch(/no such file or directory/);
  });
}
