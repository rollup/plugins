import json from '@rollup/plugin-json';

import { emitModulePackageFile } from '../../shared/rollup.config';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [json()],
  external: Object.keys(pkg.dependencies).concat(['fs', 'path']),
  output: [
    {
      file: pkg.module,
      format: 'es',
      plugins: [emitModulePackageFile()],
      sourcemap: true
    },
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'auto',
      sourcemap: true
    }
  ]
};
