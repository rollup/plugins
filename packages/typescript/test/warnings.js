import { rollup } from 'rollup';

import typescript from '..';

import { createAvaAssertions } from './helpers/ava-assertions.js';

const t = createAvaAssertions();

beforeEach(() => process.chdir(__dirname));

test.sequential('bad module in tsconfig', async () => {
  const warnings = [];
  await rollup({
    input: 'fixtures/bad-module/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/bad-module/tsconfig.json' })],
    onwarn: (warning) => warnings.push(warning)
  });

  t.snapshot(warnings);
});
