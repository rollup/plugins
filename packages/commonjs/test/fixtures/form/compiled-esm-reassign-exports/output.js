import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule } from "\u0000fixtures/form/compiled-esm-reassign-exports/input.js?commonjs-module";
var input = inputModule.exports;

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return inputModule.exports;
	hasRequiredInput = 1;
	Object.defineProperty(input, '__esModule', { value: true });
	inputModule.exports = { foo: 'bar' };
	return inputModule.exports;
}

export { requireInput as __require };
