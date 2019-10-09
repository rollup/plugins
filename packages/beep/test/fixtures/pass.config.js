const beep = require('../../lib/index');

module.exports = {
  input: 'fixtures/pass.js',
  output: {
    file: 'output/bundle.js',
    format: 'cjs'
  },
  plugins: [beep()]
};
