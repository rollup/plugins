import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

import { emitModulePackageFile } from '../../shared/rollup.config';

import pkg from './package.json';

export default {
  input: 'src/index.ts',
  plugins: [
    resolve(),
    commonjs({ include: '../../node_modules/.pnpm/registry.npmjs.org/**' }),
    typescript({ include: '**/*.{ts,js}', module: 'esnext' })
  ],
  external: Object.keys(pkg.dependencies).concat('path', 'util'),
  output: [
    { format: 'cjs', file: pkg.main, exports: 'named' },
    { file: pkg.module, format: 'es', plugins: [emitModulePackageFile()] }
  ]
};
