import { rollup } from 'rollup';

import typescript from '..';
import { evaluateBundle, getCode, onwarn } from '../../../util/test.js';

const captureThrownError = async (valueOrFactory) => {
  try {
    await (typeof valueOrFactory === 'function' ? valueOrFactory() : valueOrFactory);
  } catch (error) {
    return error;
  }

  return expect.unreachable('Expected call to throw');
};

beforeEach(() => process.chdir(__dirname));
test.sequential('supports overriding tslib with a custom path', async () => {
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
  expect(code.myParent.baseMethod()).toBe('base method');
});
test.sequential('supports overriding tslib with a custom path in a promise', async () => {
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
  expect(code.myParent.baseMethod()).toBe('base method');
});
test.sequential('fails on bad tslib path', async () => {
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
  const error = await captureThrownError(fail);

  expect(error.message).toMatch(/Could not load .*fixtures[\\/]joker[\\/]tslib\.js/);
  expect(error.message).toMatch(/imported by .*fixtures[\\/]overriding-tslib[\\/]main\.ts/);
});
test.sequential('fails without tslib installed', async () => {
  const fail = () =>
    rollup({
      input: 'fixtures/overriding-tslib/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/overriding-tslib/tsconfig.json'
        })
      ],
      onwarn
    });

  // eslint-disable-next-line no-underscore-dangle
  process.env.__TSLIB_TEST_PATH__ = 'badtslib/tslib.es6.js';
  const error = await captureThrownError(fail);

  // eslint-disable-next-line no-underscore-dangle, no-undefined
  process.env.__TSLIB_TEST_PATH__ = '';
  expect(error).toMatchSnapshot();
});
test.sequential('creates _tslib.js file when preserveModules is used', async () => {
  const bundle = await rollup({
    input: 'fixtures/preserve-modules/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/preserve-modules/tsconfig.json'
      })
    ],
    onwarn
  });
  const files = await getCode(
    bundle,
    {
      format: 'es',
      preserveModules: true
    },
    true
  );
  expect(files[0].fileName.includes('main.js'), files[0].fileName).toBe(true);
  expect(files[1].fileName.includes('tslib.es6.js'), files[1].fileName).toBe(true);
});
