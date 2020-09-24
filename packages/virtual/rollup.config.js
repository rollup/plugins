import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  plugins: [resolve(), typescript()],
  external: ['path'],
  output: [
    { format: 'cjs', file: pkg.main, exports: 'auto' },
    { format: 'esm', file: pkg.module }
  ]
};
