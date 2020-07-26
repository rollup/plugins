module.exports = {
  description:
    'returns the default if possible when requiring an ES module and requireReturnsDefault is "preferred"',
  options: {
    external: ['external-esm-named', 'external-esm-mixed', 'external-esm-default']
  },
  pluginOptions: {
    requireReturnsDefault: 'preferred',
    esmExternals: true
  }
};
