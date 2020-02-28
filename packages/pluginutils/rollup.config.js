import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  plugins: [
    resolve(),
    commonjs({ include: '../../node_modules/.pnpm/registry.npmjs.org/**' }),
    typescript({ include: '**/*.{ts,js}' })
  ],
  external: Object.keys(pkg.dependencies).concat('path', 'util'),
  output: [
    {
      format: 'cjs',
      file: pkg.main,
      exports: 'named'
    },
    {
      format: 'es',
      file: pkg.module
    }
  ]
};
