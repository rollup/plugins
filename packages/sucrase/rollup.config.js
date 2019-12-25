import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(['path', 'fs']);

export default {
  input: 'src/index.js',
  external,
  output: [
    { format: 'cjs', file: pkg.main },
    { format: 'esm', file: pkg.module }
  ]
};
