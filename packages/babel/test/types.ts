import babel from '../types';

const config: import('rollup').RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    babel({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**', /node_modules/],
      extensions: ['.js', '.coffee'],
      babelHelpers: 'runtime',
      skipPreflightCheck: true,
      babelrc: false,
      plugins: []
    })
  ]
};

export default config;
