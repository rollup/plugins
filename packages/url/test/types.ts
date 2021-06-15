import { RollupOptions } from 'rollup';

import url from '../types';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    url({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      limit: 0,
      publicPath: 'public',
      emitFiles: true,
      fileName: '[name].[hash][ext]',
      sourceDir: '',
      destDir: ''
    })
  ]
};

export default config;
