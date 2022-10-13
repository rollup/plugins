import { readFileSync } from 'fs';

import buble from '@rollup/plugin-buble';

import { createConfig } from '../../shared/rollup.config.mjs';

export default {
  ...createConfig({
    pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')),
    external: ['graphql-tag/loader.js']
  }),
  input: 'src/index.js',
  plugins: [buble()]
};
