import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule, exports as input } from "\u0000fixtures/form/typeof-module-exports/input.js?commonjs-module"

(function (module, exports) {
	var foo = 42;

	if ( 'object' === 'object' && 'object' === 'object' ) {
		module.exports = foo;
	} else if ( typeof undefined === 'function' && undefined.amd ) {
		undefined([], function () { return foo; });
	} else {
		window.foo = foo;
	}
} (inputModule, input));

export default input;
export { input as __moduleExports };
