const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  external: Object.keys(pkg.dependencies),
  output: [
    { format: 'cjs', file: pkg.main, exports: 'auto' },
    { format: 'es', file: pkg.module }
  ]
};
