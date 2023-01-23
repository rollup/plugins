import type { RollupOptions } from 'rollup';

import swc from '../types/index';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [swc({})]
};

export default config;
