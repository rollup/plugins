const nodeResolve = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'resolves imports of directories via index.js',
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-resolve-index',
      'fixtures/function/dynamic-require-resolve-index/sub',
      'fixtures/function/dynamic-require-resolve-index/node_modules/custom-module'
    ]
  }
};
