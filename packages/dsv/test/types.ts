import type { RollupOptions } from 'rollup';

import dsv from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    dsv({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      processRow(row) {
        return row;
      }
    })
  ]
};

export default config;
