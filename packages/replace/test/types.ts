// @ts-check
import { dirname } from 'path';

import { RollupOptions } from 'rollup';

import replace from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    replace({
      include: 'config.js',
      exclude: 'node_modules/**',
      delimiters: ['<@', '@>'],
      preventAssignment: true,
      VERSION: '1.0.0',
      ENVIRONMENT: JSON.stringify('development'),
      __dirname: (id) => `'${dirname(id)}'`,
      values: {
        VERSION: '1.0.0',
        ENVIRONMENT: JSON.stringify('development')
      }
    })
  ]
};

export default config;
