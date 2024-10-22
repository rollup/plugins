/* eslint-disable import/no-unresolved */

import { posix } from 'path';
import { fileURLToPath } from 'url';

import test from 'ava';
import { rollup } from 'rollup';

import dynamicImportVars from 'current-package';

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));

process.chdir(fileURLToPath(new URL('fixtures', import.meta.url)));

test('single dir', async (t) => {
  const bundle = await rollup({
    input: 'fixture-single-dir.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-single-dir.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('multiple dirs', async (t) => {
  const bundle = await rollup({
    input: 'fixture-multiple-dirs.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-multiple-dirs.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-2.js'),
    posix.resolve(DIRNAME, './fixtures/sub-dir/fixture-upwards-path.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('upwards dir path', async (t) => {
  const bundle = await rollup({
    input: 'sub-dir/fixture-upwards-path',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/sub-dir/fixture-upwards-path.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('complex concatenation', async (t) => {
  const bundle = await rollup({
    input: 'fixture-complex-concat.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-complex-concat.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-2.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('own directory', async (t) => {
  const bundle = await rollup({
    input: 'fixture-own-dir.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-own-dir.js'),
    posix.resolve(DIRNAME, './fixtures/root-module-a.js'),
    posix.resolve(DIRNAME, './fixtures/root-module-b.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('multiple dynamic imports', async (t) => {
  const bundle = await rollup({
    input: 'fixture-multiple-imports.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-multiple-imports.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-b/module-b-2.js'),
    posix.resolve(DIRNAME, './fixtures/sub-dir/fixture-upwards-path.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test("doesn't change imports that should not be changed", async (t) => {
  const bundle = await rollup({
    input: 'fixture-unchanged.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-unchanged.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('can exclude files', async (t) => {
  const bundle = await rollup({
    input: 'fixture-excluded.js',
    plugins: [
      dynamicImportVars({
        exclude: ['fixture-excluded.js']
      })
    ]
  });
  const { output } = await bundle.generate({ format: 'es' });

  const expectedFiles = [posix.resolve(DIRNAME, './fixtures/fixture-excluded.js')];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test('throws an error on failure', async (t) => {
  let thrown;
  try {
    await rollup({
      input: 'fixture-extensionless.js',
      plugins: [
        dynamicImportVars({
          exclude: ['fixture-excluded.js']
        })
      ]
    });
  } catch (_) {
    thrown = true;
  }
  t.is(thrown, true);
});

test('dynamic imports assertions', async (t) => {
  const bundle = await rollup({
    input: 'fixture-assert.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({ format: 'es' });
  const expectedFiles = [
    posix.resolve(DIRNAME, './fixtures/fixture-assert.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-1.js'),
    posix.resolve(DIRNAME, './fixtures/module-dir-a/module-a-2.js')
  ];

  t.deepEqual(
    expectedFiles,
    output.map((o) => o.facadeModuleId)
  );
  t.snapshot(output[0].code);
});

test("doesn't throw if no files in dir when option isn't set", async (t) => {
  let thrown = false;
  try {
    await rollup({
      input: 'fixture-no-files.js',
      plugins: [dynamicImportVars()]
    });
  } catch (_) {
    thrown = true;
  }
  t.false(thrown);
});

test('throws if no files in dir when `errorWhenNoFilesFound` is set', async (t) => {
  let thrown = false;
  try {
    await rollup({
      input: 'fixture-no-files.js',
      plugins: [dynamicImportVars({ errorWhenNoFilesFound: true })]
    });
  } catch (error) {
    t.deepEqual(
      error.message,
      `No files found in ./module-dir-c/*.js when trying to dynamically load concatted string from ${posix.resolve(
        DIRNAME,
        './fixtures/fixture-no-files.js'
      )}`
    );
    thrown = true;
  }
  t.true(thrown);
});

test('warns if no files in dir when `errorWhenNoFilesFound` and `warnOnError` are both set', async (t) => {
  let warningEmitted = false;
  await rollup({
    input: 'fixture-no-files.js',
    plugins: [dynamicImportVars({ errorWhenNoFilesFound: true, warnOnError: true })],
    onwarn(warning) {
      t.deepEqual(
        warning.message,
        `No files found in ./module-dir-c/*.js when trying to dynamically load concatted string from ${posix.resolve(
          DIRNAME,
          './fixtures/fixture-no-files.js'
        )}`
      );
      warningEmitted = true;
    }
  });
  t.true(warningEmitted);
});
