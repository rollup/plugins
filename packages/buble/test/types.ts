import { RollupOptions } from 'rollup';

import buble from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    buble({
      exclude: 'node_modules/**',
      include: 'config.js',
      transforms: { modules: true },
      objectAssign: true
    })
  ]
};

export default config;
