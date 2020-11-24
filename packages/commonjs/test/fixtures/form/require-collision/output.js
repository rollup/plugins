import { __module as input } from "\u0000fixtures/form/require-collision/input.js?commonjs-module"
import "\u0000foo?commonjs-require";
import require$$1 from "\u0000foo?commonjs-proxy";

(function() {
  var foo = require$$1;
  var require$$0 = "FAIL";
  console.log(foo);
})();

export { exports as __moduleExports } from "\u0000fixtures/form/require-collision/input.js?commonjs-module"
export default input.exports;
