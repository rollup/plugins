const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'accesses commonjsRequire.cache',
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-cache-reference/node_modules/{custom-module,custom-module2}{,/*.js}'
    ]
  }
};
