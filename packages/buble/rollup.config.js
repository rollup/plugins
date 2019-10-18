import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [{ format: 'es', file: pkg.module }, { format: 'cjs', file: pkg.main }],
  external: ['buble', 'rollup-pluginutils']
};
