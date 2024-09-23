const path = require('path');

const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'resolves imports of node_modules from subdirectories',
  options: {
    input: path.join(__dirname, 'sub/main.js'),
    plugins: [nodeResolve(), json()]
  },
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-package-sub/node_modules/custom-module/**'
    ]
  }
};
