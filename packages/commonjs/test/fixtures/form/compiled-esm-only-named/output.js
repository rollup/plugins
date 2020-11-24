import { __module as input } from "\u0000fixtures/form/compiled-esm-only-named/input.js?commonjs-module"

Object.defineProperty(input.exports, '__esModule', { value: true });
var foo = 'bar';
input.exports.foo = foo;
var bar = 'foo';
input.exports.bar = bar;

export { exports as __moduleExports } from "\u0000fixtures/form/compiled-esm-only-named/input.js?commonjs-module"
export { foo };
export { bar };
export default input.exports;
