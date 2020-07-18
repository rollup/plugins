const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'resolves imports of directories via package.json files',
  options: {
    plugins: [nodeResolve(), json()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-package',
      'fixtures/function/dynamic-require-package/sub',
      'fixtures/function/dynamic-require-package/node_modules/custom-module'
    ]
  }
};
