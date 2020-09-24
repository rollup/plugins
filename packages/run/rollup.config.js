import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  plugins: [typescript({ sourceMap: false })],
  external: Object.keys(pkg.dependencies).concat(['path', 'child_process']),
  output: [
    { format: 'cjs', file: pkg.main, exports: 'auto' },
    { format: 'esm', file: pkg.module }
  ]
};
