const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'resolves imports of node_modules module with halfway / subfolder access',
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-slash-access',
      'fixtures/function/dynamic-require-slash-access/sub',
      'fixtures/function/dynamic-require-slash-access/node_modules/custom-module',
      'fixtures/function/dynamic-require-slash-access/node_modules/custom-module2/*.js'
    ]
  }
};
