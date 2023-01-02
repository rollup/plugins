import type { RollupOptions } from 'rollup';

import eslintPlugin from '../types';

const rollupConfig: RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    eslintPlugin(),
    eslintPlugin({}),
    eslintPlugin({
      formatter: () => 'json'
    }),
    eslintPlugin({
      formatter: async () => 'json'
    }),
    eslintPlugin({
      fix: false,
      throwOnWarning: true,
      throwOnError: true,
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**', /node_modules/],
      extensions: ['.js', '.coffee'],
      formatter: 'json'
    })
  ]
};

export default rollupConfig;
