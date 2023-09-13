module.exports = {
  description: 'resolves both windows and posix paths',
  pluginOptions: {
    dynamicRequireTargets: [
      'fixtures/function/dynamic-require-relative-paths/sub/submodule.js',
      'fixtures/function/dynamic-require-relative-paths/sub/subsub/subsubmodule.js'
    ]
  }
};
