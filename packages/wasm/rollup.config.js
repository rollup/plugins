const pkg = require('./package.json');

const dependencies = Object.keys(pkg.dependencies || {});

export default [
  {
    input: 'src/index.js',
    output: { exports: 'named', file: 'dist/index.js', format: 'cjs' },
    external: ['path'].concat(dependencies)
  }
  // {
  //   input: 'test/index.js',
  //   output: { file: 'dist/test.js', format: 'cjs' }
  // }
];
