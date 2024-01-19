import * as commonjsHelpers from "_commonjsHelpers.js";

var input;
var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	input = { __esModule: true, default: { foo: 'bar' }};
	return input;
}

export { requireInput as __require };
