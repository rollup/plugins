import babel from 'rollup-plugin-babel';

const external = Object.keys(require('./package.json').dependencies).concat('path');

export default {
  entry: 'src/index.js',
  plugins: [babel()],
  external
};
