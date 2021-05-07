module.exports = {
  description:
    'throws when there is no require call configured as fallback for dynamicRequireTargets',
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-targets-no-fallback/dep1.js']
  }
};
