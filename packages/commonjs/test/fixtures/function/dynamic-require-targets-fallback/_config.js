module.exports = {
  description: 'keeps a require call as fallback when configured for dynamicRequireTargets',
  pluginOptions: {
    ignoreDynamicRequires: true,
    dynamicRequireTargets: ['fixtures/function/dynamic-require-targets-fallback/dep1.js']
  }
};
