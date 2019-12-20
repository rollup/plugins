const path = require('path');

module.exports = {
  pluginOptions: {
    namedExports: {
      [path.resolve(__dirname, 'foo.js')]: ['named']
    }
  }
};
