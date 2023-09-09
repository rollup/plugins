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
        return {
          foo: +row.foo,
          bar: new Date(row.bar),
          baz: row.baz === 'true',
          ...row
        };
      }
    }),
    dsv({
      processRow() {
        // void
      }
    })
  ]
};

export default config;
