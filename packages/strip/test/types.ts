import { RollupOptions } from 'rollup';

import strip from '../types/index';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    strip({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      debugger: true,
      functions: ['console.*', 'assert.*', 'expect'],
      labels: [],
      sourceMap: true
    })
  ]
};

export default config;
