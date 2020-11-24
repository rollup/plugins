import { __module as input } from "\u0000fixtures/form/multiple-var-declarations-c/input.js?commonjs-module"
import "\u0000./b?commonjs-require";
import b from "\u0000./b?commonjs-proxy";

var a = 'a'
  , c = 'c';

console.log( a, b, c );

export { exports as __moduleExports } from "\u0000fixtures/form/multiple-var-declarations-c/input.js?commonjs-module"
export default input.exports;
