const json = require('@rollup/plugin-json');
const nodeResolve = require('@rollup/plugin-node-resolve');

module.exports = {
  input: 'sub/entry.js',
  description: 'resolves imports of node_modules from subdirectories',
  options: {
    plugins: [nodeResolve(), json()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-package-sub/node_modules/custom-module/**'
    ]
  }
};
