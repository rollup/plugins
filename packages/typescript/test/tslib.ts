import { platform } from 'os';

import test from 'ava';
import { rollup, RollupError } from 'rollup';

import typescript from '..';

import { evaluateBundle, getCode, onwarn } from '../../../util/test';

test.beforeEach(() => process.chdir(__dirname));

test.serial('supports overriding tslib with a custom path', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/overriding-tslib/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/overriding-tslib/tsconfig.json',
        tslib: 'fixtures/overriding-tslib/tslib.js'
      })
    ],
    onwarn
  });
  const code = await evaluateBundle(bundle);

  t.is((code as any).myParent.baseMethod(), 'base method');
});

test.serial('supports overriding tslib with a custom path in a promise', async (t) => {
  const options = {
    tsconfig: 'fixtures/overriding-tslib/tsconfig.json',
    tslib: Promise.resolve('fixtures/overriding-tslib/tslib.js')
  };
  const bundle = await rollup({
    input: 'fixtures/overriding-tslib/main.ts',
    plugins: [typescript(options)],
    onwarn
  });
  const code = await evaluateBundle(bundle);

  t.is((code as any).myParent.baseMethod(), 'base method');
});

test.serial('fails on bad tslib path', async (t) => {
  const fail = () =>
    rollup({
      input: 'fixtures/overriding-tslib/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/overriding-tslib/tsconfig.json',
          tslib: 'fixtures/joker/tslib.js'
        })
      ],
      onwarn
    });

  const error = (await t.throwsAsync(fail)) as RollupError;

  // Note: I'm done fucking around with Windows paths
  if (platform() === 'win32') {
    t.pass();
    return;
  }

  if (error.watchFiles) {
    let [filePath] = error.watchFiles;
    filePath = filePath.substring(filePath.indexOf('packages'));
    error.watchFiles[0] = filePath;
  }

  t.snapshot(error);
});

test.serial('fails without tslib installed', async (t) => {
  const fail = () =>
    rollup({
      input: 'fixtures/overriding-tslib/main.ts',
      plugins: [typescript({ tsconfig: 'fixtures/overriding-tslib/tsconfig.json' })],
      onwarn
    });

  // eslint-disable-next-line no-underscore-dangle
  process.env.__TSLIB_TEST_PATH__ = 'badtslib/tslib.es6.js';

  const error = await t.throwsAsync(fail);

  // eslint-disable-next-line no-underscore-dangle, no-undefined
  process.env.__TSLIB_TEST_PATH__ = '';

  t.snapshot(error);
});

test.serial('creates _tslib.js file when preserveModules is used', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/preserve-modules/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/preserve-modules/tsconfig.json' })],
    preserveModules: true,
    onwarn
  });

  const files = await getCode(bundle, { format: 'es' }, true);
  t.true(files[0].fileName.includes('main.js'), files[0].fileName);
  t.true(files[1].fileName.includes('tslib.es6.js'), files[1].fileName);
});
