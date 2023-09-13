import type { RollupOptions } from 'rollup';

import json from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    json({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      preferConst: true,
      indent: '  ',
      compact: true,
      namedExports: true
    })
  ]
};

export default config;
