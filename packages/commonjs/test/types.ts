import commonjs from '../types';

const config: import('rollup').RollupOptions = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife'
  },
  plugins: [
    commonjs({
      include: 'node_modules/**',
      exclude: ['node_modules/foo/**', 'node_modules/bar/**', /node_modules/],
      extensions: ['.js', '.coffee'],
      ignoreGlobal: false,
      sourceMap: false,
      ignore: ['conditional-runtime-dependency'],
      dynamicRequireTargets: ['node_modules/logform/*.js']
    })
  ]
};

export default config;
