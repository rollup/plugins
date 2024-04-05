import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule } from "\u0000fixtures/form/typeof-module-exports/input.js?commonjs-module";
var input = inputModule.exports;

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return inputModule.exports;
	hasRequiredInput = 1;
	(function (module, exports) {
		var foo = 42;

		if ( 'object' === 'object' && 'object' === 'object' ) {
			module.exports = foo;
		} else if ( typeof undefined === 'function' && undefined.amd ) {
			undefined([], function () { return foo; });
		} else {
			window.foo = foo;
		} 
	} (inputModule, inputModule.exports));
	return inputModule.exports;
}

export { requireInput as __require };
