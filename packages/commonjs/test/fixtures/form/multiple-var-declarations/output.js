import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations/input.js?commonjs-exports"
import "\u0000./a?commonjs-require";
import require$$0 from "\u0000./a?commonjs-proxy";
import "\u0000./b?commonjs-require";
import require$$1 from "\u0000./b?commonjs-proxy";

var a = require$$0()
  , b = require$$1;

console.log( a, b );

export { input as __moduleExports, input as default };
