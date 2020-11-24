import { __module as input } from "\u0000fixtures/form/compiled-esm-deconflict/input.js?commonjs-module"

Object.defineProperty(input.exports, '__esModule', { value: true });
var foo_1 = 'bar';
input.exports.foo = foo_1;

const foo = 'also bar';

export { exports as __moduleExports } from "\u0000fixtures/form/compiled-esm-deconflict/input.js?commonjs-module"
export { foo_1 as foo };
export default input.exports;
