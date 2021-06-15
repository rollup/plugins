import { RollupOptions } from 'rollup';

import graphql from '../types';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    graphql({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**']
    })
  ]
};

export default config;
