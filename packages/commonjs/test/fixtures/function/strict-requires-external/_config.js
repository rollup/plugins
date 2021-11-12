module.exports = {
  description: 'still does not wrap external dependencies with strict require semantic',
  pluginOptions: {
    strictRequires: true
  },
  options: {
    plugins: [
      {
        resolveId(source) {
          if (source === 'external') {
            return { id: 'external', external: true };
          }
          return null;
        }
      }
    ]
  }
};
