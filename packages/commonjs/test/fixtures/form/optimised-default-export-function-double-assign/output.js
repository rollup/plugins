import { __module as input } from "\u0000fixtures/form/optimised-default-export-function-double-assign/input.js?commonjs-module"

var bar;
input.exports = bar = function foo () {};

export { exports as __moduleExports } from "\u0000fixtures/form/optimised-default-export-function-double-assign/input.js?commonjs-module"
export default input.exports;
