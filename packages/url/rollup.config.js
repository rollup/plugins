import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(['crypto', 'path', 'fs', 'util']);

export default {
  input: 'src/index.js',
  external,
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'auto' },
    { file: pkg.module, format: 'es', sourcemap: true }
  ]
};
