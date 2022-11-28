import type { RollupOptions } from 'rollup';

import yaml from '..';

const config: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    yaml({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**'],
      documentMode: 'single',
      transform(data, path) {
        if (typeof data === 'string' && data.includes('<filePath>')) {
          return path;
        }

        return data;
      }
    })
  ]
};

export default config;
