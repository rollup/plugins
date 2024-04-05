import * as commonjsHelpers from "_commonjsHelpers.js";

var input;
var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	input = (function foo () {
	  return function fooChild() {};
	}());
	return input;
}

export { requireInput as __require };
