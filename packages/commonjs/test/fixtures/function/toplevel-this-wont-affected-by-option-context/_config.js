const path = require('path');
const ID_MAIN = path.join(__dirname, 'main.js');

module.exports = {
  description: 'top-level `this` in commonjs module is not affected by the context option',
  options: {
    input: [ID_MAIN],
    context: 'window',
    output: {
      chunkFileNames: '[name].js'
    },
    plugins: []
  }
};
