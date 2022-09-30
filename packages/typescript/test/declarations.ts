import test from 'ava';
import type { ExecutionContext } from 'ava';
import { rollup } from 'rollup';

import typescript from '..';

import { getCode } from '../../../util/test';

test.beforeEach(() => process.chdir(__dirname));

// eslint-disable-next-line no-console
const onwarn = (warning: any) => console.warn(warning.toString());

test.serial('supports creating declaration files', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        outDir: 'fixtures/basic/dist',
        declaration: true
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true);
  const declaration = output[1].source as string;

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'main.d.ts']
  );

  t.true(declaration.includes('declare const answer = 42;'), declaration);
});

test.serial('supports creating declaration files in subfolder', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        outDir: 'fixtures/basic/dist/types',
        declaration: true,
        declarationMap: true
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true);
  const declaration = output[1].source as string;

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'types/main.d.ts', 'types/main.d.ts.map']
  );

  t.true(declaration.includes('declare const answer = 42;'), declaration);
  t.true(declaration.includes('//# sourceMappingURL=main.d.ts.map'), declaration);
});

test.serial('supports creating declarations with non-default rootDir', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/declaration-root-dir/src/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/declaration-root-dir/tsconfig.json'
      })
    ],
    onwarn
  });
  const output = await getCode(
    bundle,
    { format: 'es', dir: 'fixtures/declaration-root-dir/lib' },
    true
  );

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'main.d.ts']
  );
});

test.serial('supports creating declaration files for interface only source file', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/export-interface-only/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/export-interface-only/tsconfig.json',
        declarationDir: 'fixtures/export-interface-only/dist/types',
        declaration: true,
        declarationMap: true
      })
    ],
    onwarn
  });

  const output = await getCode(
    bundle,
    { format: 'es', dir: 'fixtures/export-interface-only/dist' },
    true
  );
  const declaration = output[1].source as string;

  t.deepEqual(
    output.map((out) => out.fileName),
    [
      'main.js',
      'types/interface.d.ts',
      'types/interface.d.ts.map',
      'types/main.d.ts',
      'types/main.d.ts.map'
    ]
  );

  t.true(declaration.includes('export interface ITest'), declaration);
  t.true(declaration.includes('//# sourceMappingURL=interface.d.ts.map'), declaration);
});

test.serial('supports creating declaration files in declarationDir', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        declarationDir: 'fixtures/basic/dist/types',
        declaration: true
      })
    ],
    onwarn
  });
  const output = await getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true);
  const declaration = output[1].source as string;

  t.deepEqual(
    output.map((out) => out.fileName),
    ['main.js', 'types/main.d.ts']
  );

  t.true(declaration.includes('declare const answer = 42;'), declaration);
});

async function ensureOutDirWhenCreatingDeclarationFiles(
  t: ExecutionContext,
  compilerOptionName: string
) {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        [compilerOptionName]: true
      })
    ],
    onwarn
  });
  const caughtError = await t.throwsAsync(() =>
    getCode(bundle, { format: 'es', dir: 'fixtures/basic/dist' }, true)
  );

  t.true(
    caughtError!.message.includes(
      `'outDir' or 'declarationDir' must be specified to generate declaration files`
    ),
    `Unexpected error message: ${caughtError!.message}`
  );
}

test.serial('ensures outDir is set when creating declaration files (declaration)', async (t) => {
  await ensureOutDirWhenCreatingDeclarationFiles(t, 'declaration');
});

test.serial('ensures outDir is set when creating declaration files (composite)', async (t) => {
  await ensureOutDirWhenCreatingDeclarationFiles(t, 'composite');
});
