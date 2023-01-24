import type { RollupOptions } from 'rollup';

import commonjsShim from '../types/index';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [commonjsShim()]
};

export default config;
