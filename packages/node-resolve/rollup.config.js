import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';

import pkg from './package.json';

const plugins = [
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
];
const external = Object.keys(pkg.dependencies).concat(['fs', 'path', 'os', 'util']);

export default [
  {
    input: 'src/index.js',
    plugins,
    external,
    output: [{ file: pkg.module, format: 'es' }]
  },
  {
    input: 'src/cjs-wrapper.js',
    plugins,
    external,
    output: [{ file: pkg.main, format: 'cjs' }]
  }
];
