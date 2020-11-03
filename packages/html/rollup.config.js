import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

const external = ['path'];

export default {
  input: 'src/index.ts',
  plugins: [typescript({ sourceMap: false })],
  external,
  output: [
    { format: 'cjs', file: pkg.main, exports: 'auto' },
    { format: 'es', file: pkg.module }
  ]
};
