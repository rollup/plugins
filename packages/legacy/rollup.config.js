import buble from '@rollup/plugin-buble';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [buble()],
  external: ['path'],
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    { file: pkg.module, format: 'es', sourcemap: true }
  ]
};
