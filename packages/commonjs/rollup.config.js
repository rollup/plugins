import json from '@rollup/plugin-json';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [json()],
  external: Object.keys(pkg.dependencies).concat(['fs', 'path']),
  output: [
    {
      file: pkg.module,
      format: 'es',
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
