import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import typescript from 'current-package';
import { getCode, onwarn } from '../../../util/test.js';
beforeEach(() => process.chdir(fileURLToPath(new URL('.', import.meta.url))));
test.sequential('works as ESM build', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [
      typescript({
        tsconfig: 'fixtures/basic/tsconfig.json',
        target: 'es5'
      })
    ],
    onwarn
  });
  const code = await getCode(bundle, {
    format: 'es'
  });
  expect(code.includes('number'), code).toBe(false);
  expect(code.includes('const'), code).toBe(false);
});
