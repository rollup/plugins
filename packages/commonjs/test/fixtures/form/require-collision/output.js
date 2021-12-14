import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/require-collision/input.js?commonjs-exports"
import require$$1 from "\u0000CWD/fixtures/form/require-collision/foo.js?commonjs-proxy";

(function() {
  var foo = require$$1;
  var require$$0 = "FAIL";
  console.log(foo);
})();

export { input as __moduleExports, input as default };
