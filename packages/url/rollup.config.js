import babel from 'rollup-plugin-babel';

import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(['crypto', 'path', 'fs', 'util']);

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 8
            }
          }
        ]
      ]
    })
  ],
  external,
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ]
};
