import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  plugins: [typescript()],
  external: [...Object.keys(pkg.devDependencies), 'url'],
  output: [
    { format: 'cjs', file: pkg.main, sourcemap: true, exports: 'auto' },
    { format: 'esm', file: pkg.module, sourcemap: true }
  ]
};
