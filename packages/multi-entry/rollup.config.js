import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      presets: [['@babel/env', { targets: { node: '8' }, modules: false }]],
      babelrc: false
    })
  ],
  external: Object.keys(pkg.dependencies),
  output: [
    { format: 'cjs', file: pkg.main },
    { format: 'es', file: pkg.module }
  ]
};
