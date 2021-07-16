import buble from '@rollup/plugin-buble';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  external: [...Object.keys(pkg.dependencies), 'os'],
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  plugins: [buble()]
};
