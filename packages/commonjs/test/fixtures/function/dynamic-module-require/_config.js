module.exports = {
  // TODO Lukas think about a way to re-implement
  skip: true,
  description: 'supports dynamic require',
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-module-require/submodule.js']
  }
};
