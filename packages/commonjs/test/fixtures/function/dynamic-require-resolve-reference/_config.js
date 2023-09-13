const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'accesses commonjsRequire.resolve',
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-resolve-reference/node_modules/{custom-module,custom-module2}{,/*.js}'
    ]
  }
};
