import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(['terser']);

export default {
  input: 'src/index.js',
  plugins: [typescript({ sourceMap: false })],
  external,
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    { file: pkg.module, format: 'es', sourcemap: true }
  ]
};
