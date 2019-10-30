const { builtinModules } = require('module');

const pkg = require('./package.json');

const dependencies = Object.keys(pkg.dependencies || {});

export default [
  {
    input: 'src/index.js',
    output: { exports: 'named', file: 'dist/index.js', format: 'cjs' },
    external: [...builtinModules, ...dependencies]
  }
];
