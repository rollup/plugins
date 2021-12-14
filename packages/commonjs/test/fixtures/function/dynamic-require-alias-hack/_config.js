module.exports = {
  description: 'resolves both windows and posix paths',
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-alias-hack/stub.js'],
    ignoreDynamicRequires: true
  }
};
