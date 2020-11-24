import { __module as input } from "\u0000fixtures/form/multiple-var-declarations-b/input.js?commonjs-module"
import "\u0000./a?commonjs-require";
import a from "\u0000./a?commonjs-proxy";

var b = 42;

console.log( a, b );

export { exports as __moduleExports } from "\u0000fixtures/form/multiple-var-declarations-b/input.js?commonjs-module"
export default input.exports;
