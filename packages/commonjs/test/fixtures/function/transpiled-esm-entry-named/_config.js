const path = require('path');

module.exports = {
  description:
    'Creates correct exports if an ES module that was transpiled to CJS is used as entry point',
  options: {
    onwarn(warning) {
      if (warning.code !== 'MIXED_EXPORTS') {
        throw new Error(warning.message);
      }
    },
    input: [path.join(__dirname, 'main.js'), path.join(__dirname, 'entry.js')]
  }
};
