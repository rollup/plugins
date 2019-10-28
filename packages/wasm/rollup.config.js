const pkg = require('./package.json');
const { builtinModules } = require('module');

const dependencies = Object.keys(pkg.dependencies || {});

export default [
  {
    input: 'src/index.js',
    output: { exports: 'named', file: 'dist/index.js', format: 'cjs' },
    external: [ ...builtinModules, ...dependencies ]
  }
  // {
  //   input: 'test/index.js',
  //   output: { file: 'dist/test.js', format: 'cjs' }
  // }
];
