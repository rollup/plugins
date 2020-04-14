import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';

import pkg from './package.json';

export default {
  input: 'src/index.js',
  plugins: [
    json(),
    babel({
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 6
            }
          }
        ]
      ]
    })
  ],
  external: Object.keys(pkg.dependencies).concat(['fs', 'path', 'os', 'util']),
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ]
};
