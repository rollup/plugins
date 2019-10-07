import beep from '../../lib/index';

export default {
  input: 'fixtures/pass.js',
  output: {
    file: 'output/bundle.js',
    format: 'cjs'
  },
  plugins: [beep()]
};
