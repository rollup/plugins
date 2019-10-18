// @ts-check
import buble from '..';

/** @type {import("rollup").RollupOptions} */
const config = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    buble({
      exclude: 'node_modules/**',
      include: 'config.js',
      transforms: { modules: true }
    })
  ]
};

export default config;
