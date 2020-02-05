// @ts-check
import multiEntry from "..";

/** @type {import("rollup").RollupOptions} */
const config = {
  input: ["main.js", "secondary.js"],
  output: {
    file: "bundle.js",
    format: "iife",
    name: "MyModule"
  },
  plugins: [
    multiEntry({
      exports: false
    })
  ]
};

export default config;
