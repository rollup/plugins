// @ts-check
import { dirname } from "path";

import inject, { RollupInjectOptions } from "..";

/** @type {import("rollup").RollupOptions} */
const config = {
  input: "main.js",
  output: {
    file: "bundle.js",
    format: "iife"
  },
  plugins: [
    inject({
      include: "config.js",
      exclude: "node_modules/**",
      Promise: ["es6-promise", "Promise"],
      $: "jquery",
      modules: {
        Promise: ["es6-promise", "Promise"],
        $: "jquery"
      }
    })
  ]
};

export default config;
