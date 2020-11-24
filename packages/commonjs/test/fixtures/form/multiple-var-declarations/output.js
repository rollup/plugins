import { __module as input } from "\u0000fixtures/form/multiple-var-declarations/input.js?commonjs-module"
import "\u0000./a?commonjs-require";
import "\u0000./b?commonjs-require";
import require$$0 from "\u0000./a?commonjs-proxy";
import b from "\u0000./b?commonjs-proxy";

var a = require$$0();

console.log( a, b );

export { exports as __moduleExports } from "\u0000fixtures/form/multiple-var-declarations/input.js?commonjs-module"
export default input.exports;
