import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule } from "\u0000fixtures/form/typeof-module-exports/input.js?commonjs-module";
var input = inputModule.exports;

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

var inputExports = inputModule.exports;
export default /*@__PURE__*/commonjsHelpers.getDefaultExportFromCjs(inputExports);
export { inputExports as __moduleExports };
