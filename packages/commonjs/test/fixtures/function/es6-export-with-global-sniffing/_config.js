const nodeResolve = require('@rollup/plugin-node-resolve');

module.exports = {
  options: {
    plugins: [nodeResolve()]
  },
  pluginOptions: {}
};
