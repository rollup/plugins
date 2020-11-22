// @ts-check
import { nodeResolve } from '..';

/** @type {import("rollup").RollupOptions} */
const config = {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'MyModule'
  },
  plugins: [
    nodeResolve({
      browser: true,
      moduleDirectories: ['js_modules'],
      dedupe: ['lodash'],
      extensions: ['.mjs', '.js', '.jsx', '.json'],
      jail: '/my/jail/path',
      preferBuiltins: false,
      mainFields: ['untranspiled', 'module', 'main'],
      modulesOnly: true,
      resolveOnly: ['some_module', /^@some_scope\/.*$/]
    })
  ]
};

export default config;
