const beep = require('../../lib/index');

module.exports = {
  input: 'fixtures/error.js',
  output: {
    file: 'output/bundle.js',
    format: 'cjs',
    exports: 'auto'
  },
  plugins: [beep()]
};
