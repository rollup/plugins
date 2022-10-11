import { fileURLToPath } from 'url';

import test from 'ava';

import { rollup } from 'rollup';

import typescript from 'current-package';

import { getCode, onwarn } from '../../../util/test.js';

test.beforeEach(() => process.chdir(fileURLToPath(new URL('.', import.meta.url))));

test.serial('works as ESM build', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, { format: 'es' });

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});
