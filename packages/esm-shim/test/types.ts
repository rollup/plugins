import type { RollupOptions } from 'rollup';

import esmShimDefault, { esmShim } from '../types/index';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [esmShimDefault(), esmShim()]
};

export default config;
