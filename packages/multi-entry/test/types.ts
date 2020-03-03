import { RollupOptions } from 'rollup';

import multiEntry from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    multiEntry({
      include: 'src/*',
      exclude: 'src/foo/**',
      exports: false,
    })
  ]
};

export default config;
