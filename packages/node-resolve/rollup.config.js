import json from '@rollup/plugin-json';

import { emitModulePackageFile } from '../../shared/rollup.config';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [json()],
  external: [...Object.keys(pkg.dependencies), 'fs', 'path', 'os', 'util', 'url'],
  onwarn: (warning) => {
    throw new Error(warning);
  },
  output: [
    { file: pkg.main, format: 'cjs', exports: 'named' },
    { file: pkg.module, format: 'es', plugins: [emitModulePackageFile()] }
  ]
};
