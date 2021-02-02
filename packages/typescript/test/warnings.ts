import test from 'ava';
import { rollup } from 'rollup';

import typescript from '..';

test.beforeEach(() => process.chdir(__dirname));

test.serial('bad module in tsconfig', async (t) => {
  const warnings: any[] = [];
  await rollup({
    input: 'fixtures/bad-module/main.ts',
    plugins: [typescript({ tsconfig: 'fixtures/bad-module/tsconfig.json' })],
    onwarn: (warning) => warnings.push(warning)
  });

  t.snapshot(warnings);
});
