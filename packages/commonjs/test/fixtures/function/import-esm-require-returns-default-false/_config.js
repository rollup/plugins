module.exports = {
  description:
    'returns the namespace when requiring an ES module and requireReturnsDefault is false',
  options: {
    external: ['external-esm-named', 'external-esm-mixed', 'external-esm-default']
  },
  pluginOptions: {
    requireReturnsDefault: false
  }
};
