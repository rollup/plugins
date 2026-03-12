import { rollup } from 'rollup';

import typescript from '..';
import { getCode, onwarn } from '../../../util/test';

beforeEach(() => process.chdir(__dirname));

const captureThrownError = async (valueOrFactory) => {
  try {
    await (typeof valueOrFactory === 'function' ? valueOrFactory() : valueOrFactory);
  } catch (error) {
    return error;
  }

  return expect.unreachable('Expected call to throw');
};
test.sequential('supports creating declaration files', async () => {
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
  const output = await getCode(
    bundle,
    {
      format: 'es',
      dir: 'fixtures/basic/dist'
    },
    true
  );
  const declaration = output[1].source;
  expect(output.map((out) => out.fileName)).toEqual(['main.js', 'main.d.ts']);
  expect(declaration.includes('declare const answer = 42;'), declaration).toBe(true);
});
test.sequential('supports creating declaration files in subfolder', async () => {
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
  const output = await getCode(
    bundle,
    {
      format: 'es',
      dir: 'fixtures/basic/dist'
    },
    true
  );
  const declaration = output[2].source;
  expect(output.map((out) => out.fileName)).toEqual([
    'main.js',
    'types/main.d.ts.map',
    'types/main.d.ts'
  ]);
  expect(declaration.includes('declare const answer = 42;'), declaration).toBe(true);
  expect(declaration.includes('//# sourceMappingURL=main.d.ts.map'), declaration).toBe(true);
});
test.sequential('supports creating declarations with non-default rootDir', async () => {
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
    {
      format: 'es',
      dir: 'fixtures/declaration-root-dir/lib'
    },
    true
  );
  expect(output.map((out) => out.fileName)).toEqual(['main.js', 'main.d.ts']);
});
test.sequential('supports creating declaration files for interface only source file', async () => {
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
    {
      format: 'es',
      dir: 'fixtures/export-interface-only/dist'
    },
    true
  );
  const declaration = output[2].source;
  expect(output.map((out) => out.fileName)).toEqual([
    'main.js',
    'types/interface.d.ts.map',
    'types/interface.d.ts',
    'types/main.d.ts.map',
    'types/main.d.ts'
  ]);
  expect(declaration.includes('export interface ITest'), declaration).toBe(true);
  expect(declaration.includes('//# sourceMappingURL=interface.d.ts.map'), declaration).toBe(true);
});
test.sequential(
  'supports creating declaration files for type-only source files that are implicitly included',
  async () => {
    const bundle = await rollup({
      input: 'fixtures/implicitly-included-type-only-file/main.ts',
      plugins: [
        typescript({
          tsconfig: 'fixtures/implicitly-included-type-only-file/tsconfig.json',
          declarationDir: 'fixtures/implicitly-included-type-only-file/dist/types',
          declaration: true
        }),
        onwarn
      ]
    });
    const output = await getCode(
      bundle,
      {
        format: 'es',
        dir: 'fixtures/implicitly-included-type-only-file/dist'
      },
      true
    );
    const declaration = output[1].source;
    expect(output.map((out) => out.fileName)).toEqual(
      // 'types/should-not-be-emitted-types.d.ts' should not be emitted because 'main.ts' does not import/export from it.
      ['main.js', 'types/should-be-emitted-types.d.ts', 'types/main.d.ts']
    );
    expect(declaration.includes('export type MyNumber = number;'), declaration).toBe(true);
  }
);
test.sequential('supports creating declaration files in declarationDir', async () => {
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
  const output = await getCode(
    bundle,
    {
      format: 'es',
      dir: 'fixtures/basic/dist'
    },
    true
  );
  const declaration = output[1].source;
  expect(output.map((out) => out.fileName)).toEqual(['main.js', 'types/main.d.ts']);
  expect(declaration.includes('declare const answer = 42;'), declaration).toBe(true);
});
async function ensureOutDirWhenCreatingDeclarationFiles(compilerOptionName) {
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
  const caughtError = await captureThrownError(() =>
    getCode(
      bundle,
      {
        format: 'es',
        dir: 'fixtures/basic/dist'
      },
      true
    )
  );
  expect(
    caughtError.message.includes(
      `'outDir' or 'declarationDir' must be specified to generate declaration files`
    ),
    `Unexpected error message: ${caughtError.message}`
  ).toBe(true);
}
test.sequential('ensures outDir is set when creating declaration files (declaration)', async () => {
  await ensureOutDirWhenCreatingDeclarationFiles('declaration');
});
test.sequential('ensures outDir is set when creating declaration files (composite)', async () => {
  await ensureOutDirWhenCreatingDeclarationFiles('composite');
});
