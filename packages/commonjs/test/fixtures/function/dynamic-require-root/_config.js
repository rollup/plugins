module.exports = {
  description: 'supports specifying a dynamic require root',
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-root/submodule.js'],
    dynamicRequireRoot: 'fixtures/function/dynamic-require-root'
  }
};
