/* eslint-disable import/no-unresolved */

const { join } = require('path');

const { rollup } = require('rollup');

const dynamicImportVars = require('current-package');

process.chdir(join(__dirname, 'fixtures'));
test('single dir', async () => {
  const bundle = await rollup({
    input: 'fixture-single-dir.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-single-dir.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('multiple dirs', async () => {
  const bundle = await rollup({
    input: 'fixture-multiple-dirs.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-multiple-dirs.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js'),
    require.resolve('./fixtures/module-dir-b/module-b-1.js'),
    require.resolve('./fixtures/module-dir-b/module-b-2.js'),
    require.resolve('./fixtures/sub-dir/fixture-upwards-path.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('upwards dir path', async () => {
  const bundle = await rollup({
    input: 'sub-dir/fixture-upwards-path',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/sub-dir/fixture-upwards-path.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('complex concatenation', async () => {
  const bundle = await rollup({
    input: 'fixture-complex-concat.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-complex-concat.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js'),
    require.resolve('./fixtures/module-dir-b/module-b-1.js'),
    require.resolve('./fixtures/module-dir-b/module-b-2.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('own directory', async () => {
  const bundle = await rollup({
    input: 'fixture-own-dir.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-own-dir.js'),
    require.resolve('./fixtures/root-module-a.js'),
    require.resolve('./fixtures/root-module-b.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('multiple dynamic imports', async () => {
  const bundle = await rollup({
    input: 'fixture-multiple-imports.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-multiple-imports.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js'),
    require.resolve('./fixtures/module-dir-b/module-b-1.js'),
    require.resolve('./fixtures/module-dir-b/module-b-2.js'),
    require.resolve('./fixtures/sub-dir/fixture-upwards-path.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test("doesn't change imports that should not be changed", async () => {
  const bundle = await rollup({
    input: 'fixture-unchanged.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-unchanged.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('can exclude files', async () => {
  const bundle = await rollup({
    input: 'fixture-excluded.js',
    plugins: [
      dynamicImportVars({
        exclude: ['fixture-excluded.js']
      })
    ]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [require.resolve('./fixtures/fixture-excluded.js')];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test('throws an error on failure', async () => {
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
  expect(thrown).toBe(true);
});
test('dynamic imports assertions', async () => {
  const bundle = await rollup({
    input: 'fixture-assert.js',
    plugins: [dynamicImportVars()]
  });
  const { output } = await bundle.generate({
    format: 'es'
  });
  const expectedFiles = [
    require.resolve('./fixtures/fixture-assert.js'),
    require.resolve('./fixtures/module-dir-a/module-a-1.js'),
    require.resolve('./fixtures/module-dir-a/module-a-2.js')
  ];
  expect(expectedFiles).toEqual(output.map((o) => o.facadeModuleId));
  expect(output[0].code).toMatchSnapshot();
});
test("doesn't throw if no files in dir when option isn't set", async () => {
  let thrown = false;
  try {
    await rollup({
      input: 'fixture-no-files.js',
      plugins: [dynamicImportVars()]
    });
  } catch (_) {
    thrown = true;
  }
  expect(thrown).toBe(false);
});
test('throws if no files in dir when `errorWhenNoFilesFound` is set', async () => {
  let thrown = false;
  try {
    await rollup({
      input: 'fixture-no-files.js',
      plugins: [
        dynamicImportVars({
          errorWhenNoFilesFound: true
        })
      ]
    });
  } catch (error) {
    expect(error.message).toEqual(
      `No files found in ./module-dir-c/*.js when trying to dynamically load concatted string from ${require.resolve(
        './fixtures/fixture-no-files.js'
      )}`
    );
    thrown = true;
  }
  expect(thrown).toBe(true);
});
test('warns if no files in dir when `errorWhenNoFilesFound` and `warnOnError` are both set', async () => {
  let warningEmitted = false;
  await rollup({
    input: 'fixture-no-files.js',
    plugins: [
      dynamicImportVars({
        errorWhenNoFilesFound: true,
        warnOnError: true
      })
    ],
    onwarn(warning) {
      expect(warning.message).toEqual(
        `No files found in ./module-dir-c/*.js when trying to dynamically load concatted string from ${require.resolve(
          './fixtures/fixture-no-files.js'
        )}`
      );
      warningEmitted = true;
    }
  });
  expect(warningEmitted).toBe(true);
});
