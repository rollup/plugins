import { RollupOptions } from 'rollup';

import multiEntry from '../types';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    multiEntry({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      exports: false,
      entryFileName: 'multi-entry.js'
    })
  ]
};

export default config;
