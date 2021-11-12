const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description: 'supports strictRequires with mixed ESM',
  pluginOptions: {
    strictRequires: true,
    transformMixedEsModules: true
  },
  options: {
    plugins: [nodeResolve()]
  }
};
