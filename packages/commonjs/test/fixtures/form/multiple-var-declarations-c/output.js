import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations-c/input.js?commonjs-exports"
import "\u0000./b?commonjs-require";
import b from "\u0000./b?commonjs-proxy";

var a = 'a'
  , c = 'c';

console.log( a, b, c );

export { input as __moduleExports, input as default };
