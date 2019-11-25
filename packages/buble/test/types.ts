// @ts-check
import buble, { RollupBubleOptions } from '..';

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
      transforms: { modules: true },
      objectAssign: true,
    })
  ]
};

export default config;
