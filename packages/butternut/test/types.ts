// @ts-check
import butternut from '..';

/** @type {import("rollup").RollupOptions} */
const config = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    butternut({
      exclude: 'node_modules/**',
      include: 'config.js',
      transforms: {
        check: false,
        allowDangerousEval: false,
        sourceMap: true,
        includeContent: true
      }
    })
  ]
};

export default config;
