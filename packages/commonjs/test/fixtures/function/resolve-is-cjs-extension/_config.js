module.exports = {
  description: 'always resolve cjs detection even if an imported file has an unknown extension',
  options: {
    plugins: [
      {
        resolveId(importee) {
          if (importee === 'second') {
            return `${__dirname}/second.x`;
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {}
};
