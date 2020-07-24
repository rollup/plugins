// TODO Lukas do the same with externals
module.exports = {
  description: 'allows configuring requireReturnsDefault for externals with a function',
  options: {
    external: ['external-esm-named', 'external-esm-mixed', 'external-esm-default']
  },
  pluginOptions: {
    requireReturnsDefault: (id) => {
      if (id === 'external-esm-mixed') return true;
      if (id === 'external-esm-default') return false;
      return 'auto';
    }
  }
};
