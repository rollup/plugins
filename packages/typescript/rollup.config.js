import buble from '@rollup/plugin-buble';

import pkg from './package.json';

const external = Object.keys(pkg.dependencies).concat(['path', 'fs', 'typescript']);

export default {
  input: "src/index.js",
  plugins: [buble()],
  external,
  output: [
    {
      format: "cjs",
      file: pkg.main
    },
    {
      format: "es",
      file: pkg.module
    }
  ]
};
