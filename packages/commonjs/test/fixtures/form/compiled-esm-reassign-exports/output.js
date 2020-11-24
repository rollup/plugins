import { __module as input } from "\u0000fixtures/form/compiled-esm-reassign-exports/input.js?commonjs-module"

Object.defineProperty(input.exports, '__esModule', { value: true });
input.exports = { foo: 'bar' };

export { exports as __moduleExports } from "\u0000fixtures/form/compiled-esm-reassign-exports/input.js?commonjs-module"
export default input.exports;
