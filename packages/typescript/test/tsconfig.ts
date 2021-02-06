import test from 'ava';
import { rollup } from 'rollup';

import typescript from '..';

import { getCode, onwarn } from '../../../util/test';

test.beforeEach(() => process.chdir(__dirname));

test.serial('inline config without tsconfig + rootDir', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        declaration: true,
        declarationDir: 'fixtures/basic/dist/types',
        exclude: 'fixtures/basic/dist/types',
        include: 'fixtures/basic/*.ts',
        tsconfig: false,
        rootDir: 'fixtures/basic'
      })
    ],
    onwarn
  });
  const files = await getCode(bundle, { format: 'esm', dir: 'fixtures/basic/dist' }, true);
  const [, { source }] = files;

  t.snapshot(files.map(({ fileName }) => fileName));
  t.true((source as string)?.includes('declare const answer = 42;'));
});

test.serial('inline config without tsconfig without rootDir fails', async (t) => {
  const fail = () =>
    rollup({
      input: 'fixtures/basic/main.ts',
      plugins: [
        typescript({
          declaration: true,
          declarationDir: 'fixtures/basic/dist/types',
          exclude: 'fixtures/basic/dist/types',
          include: 'fixtures/basic/*.ts',
          tsconfig: false
        })
      ],
      onwarn
    });

  const error = await t.throwsAsync(fail);
  t.snapshot(error);
});
