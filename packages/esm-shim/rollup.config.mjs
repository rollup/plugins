import { readFileSync } from 'node:fs';

import { createConfig } from '../../shared/rollup.config.mjs';

export default {
  ...createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), { encoding: 'utf-8' }))
  }),
  input: 'src/index.ts'
};
