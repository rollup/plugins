import { __module as input } from "\u0000fixtures/form/optimised-named-export/input.js?commonjs-module"

var foo = 'a';
input.exports.foo = foo;
var bar = 'b';
input.exports.bar = bar;

export { exports as __moduleExports } from "\u0000fixtures/form/optimised-named-export/input.js?commonjs-module"
export { foo };
export { bar };
export default input.exports;
