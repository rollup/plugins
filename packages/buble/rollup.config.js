import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    { format: 'es', file: pkg.module },
    { format: 'cjs', file: pkg.main, exports: 'auto' }
  ],
  external: Object.keys(pkg.dependencies),
  plugins: [typescript({ sourceMap: false })]
};
