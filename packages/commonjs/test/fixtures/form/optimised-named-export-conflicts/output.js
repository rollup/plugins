import { __module as input } from "\u0000fixtures/form/optimised-named-export-conflicts/input.js?commonjs-module"

var foo = 1;
var bar = 2;

var foo_1 = 'a';
input.exports.foo = foo_1;
var bar_1 = 'b';
input.exports.bar = bar_1;

export { exports as __moduleExports } from "\u0000fixtures/form/optimised-named-export-conflicts/input.js?commonjs-module"
export { foo_1 as foo };
export { bar_1 as bar };
export default input.exports;
