import * as commonjsHelpers from "_commonjsHelpers.js";

var input;
var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var bar;
	input = bar = function foo () {};
	return input;
}

export { requireInput as __require };
