import { fileURLToPath } from 'url';


import { rollup } from 'rollup';

import typescript from 'current-package';

import { getCode, onwarn } from '../../../util/test.js';
import { createAvaAssertions } from './helpers/ava-assertions.js';

const t = createAvaAssertions();

beforeEach(() => process.chdir(fileURLToPath(new URL('.', import.meta.url))));

test.sequential('works as ESM build', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/basic/tsconfig.json', target: 'es5' })],
    onwarn
  });
  const code = await getCode(bundle, { format: 'es' });

  t.false(code.includes('number'), code);
  t.false(code.includes('const'), code);
});
