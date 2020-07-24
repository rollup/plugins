module.exports = {
  description:
    'returns the default when requiring an ES module and requireReturnsDefault is "auto" if there are no named exports',
  options: {
    external: ['external-esm-named', 'external-esm-mixed', 'external-esm-default']
  },
  pluginOptions: {
    requireReturnsDefault: 'auto'
  }
};
