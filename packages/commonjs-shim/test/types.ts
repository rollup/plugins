import type { RollupOptions } from 'rollup';

import commonjsShim from '../src';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [commonjsShim()]
};

export default config;
