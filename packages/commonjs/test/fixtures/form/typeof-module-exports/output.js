import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as input } from "\u0000fixtures/form/typeof-module-exports/input.js?commonjs-module"

(function (module, exports) {
var foo = 42;

if ( 'object' === 'object' && 'object' === 'object' ) {
	module.exports = foo;
} else if ( typeof undefined === 'function' && undefined.amd ) {
	undefined([], function () { return foo; });
} else {
	window.foo = foo;
}
}(input, input.exports));

export { exports as __moduleExports } from "\u0000fixtures/form/typeof-module-exports/input.js?commonjs-module"
export default input.exports;
