import { __module as input } from "\u0000fixtures/form/optimised-default-export-iife/input.js?commonjs-module"

input.exports = (function foo () {
  return function fooChild() {};
}());

export { exports as __moduleExports } from "\u0000fixtures/form/optimised-default-export-iife/input.js?commonjs-module"
export default input.exports;
