module.exports = {
  description: 'works when directly importing a dynamic module from es import',
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-from-es-import/submodule.js'],
    transformMixedEsModules: true
  }
};
