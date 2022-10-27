import { RollupOptions } from 'rollup';

import terser from '../types/index';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [terser({})]
};

export default config;
