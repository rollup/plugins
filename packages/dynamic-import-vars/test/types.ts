import type { RollupOptions } from 'rollup';

import dynamicImportVars, { dynamicImportToGlob } from '../src';

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
    }),
    {
      name: 'test:dynamicImportToGlob',
      buildStart() {
        const code = `import("./foo.js")`;
        const node = this.parse(code);
        dynamicImportToGlob(node, code);
      }
    }
  ]
};

export default config;
