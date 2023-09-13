module.exports = {
  description: 'supports dynamic require with code-splitting',
  options: {
    input: [
      'fixtures/function/dynamic-require-code-splitting/main',
      'fixtures/function/dynamic-require-code-splitting/main2'
    ],
    output: {
      chunkFileNames: 'generated-[name].js'
    }
  },
  pluginOptions: {
    dynamicRequireTargets: ['fixtures/function/dynamic-require-code-splitting/target?.js'],
    transformMixedEsModules: true
  }
};
