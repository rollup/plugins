const path = require('path');

module.exports = {
  description: 'handles dynamic requires when entry is from a custom loader',
  options: {
    plugins: [
      {
        load(id) {
          if (id === path.resolve('fixtures/function/dynamic-require-different-loader/main.js')) {
            return 'import submodule1 from "./submodule1"; export default submodule1();';
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-different-loader/submodule2.js'],
    transformMixedEsModules: true
  }
};
