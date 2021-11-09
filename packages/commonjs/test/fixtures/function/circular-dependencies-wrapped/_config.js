module.exports = {
  description: 'supports circular dependencies for wrapped modules',
  options: {
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        throw new Error(warning.message);
      }
    },
    output: {
      exports: 'named'
    }
  },
  pluginOptions: {
    strictRequires: false
  }
};
