module.exports = {
  description:
    'keeps a replaced module.exports that a re-entrant require completed through an ES module',
  options: {
    onwarn(warning) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        throw new Error(warning.message);
      }
    }
  },
  pluginOptions: {
    strictRequires: true
  }
};
