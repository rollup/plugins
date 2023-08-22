import { readFileSync } from 'fs';

import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';

import { createConfig } from '../../shared/rollup.config.mjs';

export default {
  ...createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  }),
  input: 'src/index.js',
  plugins: [json(), typescript()]
};
