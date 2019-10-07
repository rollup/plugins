import beep from '../../lib/index';

export default {
  input: 'fixtures/error.js',
  output: {
    file: 'output/bundle.js',
    format: 'cjs'
  },
  plugins: [beep()]
};
