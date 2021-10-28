import * as commonjsHelpers from "_commonjsHelpers.js";
import { commonjsRequire as commonjsRequire } from "_commonjs-dynamic-modules";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations-c/input.js?commonjs-exports"
import require$$0 from "\u0000/Users/lukastaegert/Github/rollup-plugins/packages/commonjs/test/fixtures/form/multiple-var-declarations-c/b.js?commonjs-proxy";

var a = 'a'
  , b = require$$0
  , c = 'c';

console.log( a, b, c );

export { input as __moduleExports, input as default };
