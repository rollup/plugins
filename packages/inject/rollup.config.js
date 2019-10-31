import buble from "rollup-plugin-buble";

import pkg from "./package.json";

const external = Object.keys(pkg.dependencies).concat("path");

export default {
  input: "src/index.js",
  plugins: [buble()],
  external,
  output: [{ file: pkg.main, format: "cjs" }, { file: pkg.module, format: "es" }]
};
