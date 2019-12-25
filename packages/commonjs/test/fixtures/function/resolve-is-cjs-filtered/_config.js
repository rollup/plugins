module.exports = {
  description: 'always resolve cjs detection even if an imported file is filtered',
  options: {
    plugins: [
      {
        resolveId(importee) {
          if (importee === 'second') {
            return `${__dirname}/second.js`;
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {
    include: ['fixtures/function/resolve-is-cjs-filtered/main.js']
  }
};
