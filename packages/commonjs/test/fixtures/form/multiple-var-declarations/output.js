import * as commonjsHelpers from "_commonjsHelpers.js";
import { commonjsRequire as commonjsRequire } from "_commonjs-dynamic-modules";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations/input.js?commonjs-exports"
import require$$0 from "\u0000/Users/lukastaegert/Github/rollup-plugins/packages/commonjs/test/fixtures/form/multiple-var-declarations/a.js?commonjs-proxy";
import require$$1 from "\u0000/Users/lukastaegert/Github/rollup-plugins/packages/commonjs/test/fixtures/form/multiple-var-declarations/b.js?commonjs-proxy";

var a = require$$0()
  , b = require$$1;

console.log( a, b );

export { input as __moduleExports, input as default };
