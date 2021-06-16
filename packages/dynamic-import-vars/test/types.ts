import { RollupOptions } from 'rollup';

import dynamicImportVars from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    dynamicImportVars({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      warnOnError: true
    })
  ]
};

export default config;
