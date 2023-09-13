const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'returns the same module instance if required directly or via package.json/index.js',
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-instances/direct',
      'fixtures/function/dynamic-require-instances/direct/index.js',
      'fixtures/function/dynamic-require-instances/package',
      'fixtures/function/dynamic-require-instances/package/main.js'
    ]
  }
};
