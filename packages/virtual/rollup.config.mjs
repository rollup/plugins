import { readFileSync } from 'fs';

import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import { createConfig } from '../../shared/rollup.config.mjs';

export default {
  ...createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  }),
  plugins: [resolve(), typescript()]
};
