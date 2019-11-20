import buble from '@rollup/plugin-buble';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [buble()],
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ]
};
