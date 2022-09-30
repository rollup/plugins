import { readFileSync } from 'fs';

import json from '@rollup/plugin-json';

import { createConfig } from '../../shared/rollup.config.mjs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default {
  ...createConfig({ pkg }),
  input: 'src/index.js',
  plugins: [json()]
};
