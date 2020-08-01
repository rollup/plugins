module.exports = {
  description: 'always uses the default export when esmExternals is not used',
  options: {
    external: [
      'external-cjs-exports',
      'external-cjs-module-exports',
      'external-esm-named',
      'external-esm-mixed',
      'external-esm-default'
    ]
  },
  pluginOptions: {
    esmExternals: true
  }
};
