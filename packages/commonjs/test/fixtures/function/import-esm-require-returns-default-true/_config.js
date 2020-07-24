module.exports = {
  description:
    'always returns the default when requiring an ES module and requireReturnsDefault is "true"',
  options: {
    external: ['external-esm-named', 'external-esm-mixed', 'external-esm-default']
  },
  pluginOptions: {
    requireReturnsDefault: true
  }
};
