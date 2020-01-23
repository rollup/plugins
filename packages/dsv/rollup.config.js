import pkg from './package.json';

export default {
  input: 'src/index.js',
  external: [...Object.keys(pkg.dependencies), 'path'],
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' }
  ]
};
