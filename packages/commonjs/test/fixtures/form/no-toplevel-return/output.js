import * as commonjsHelpers from "_commonjsHelpers.js";

var input;
var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var foo = function () {
		return;
	};

	var bar = () => {
		return;
	};

	function baz () {
		return;
	}

	input = 42;
	return input;
}

export { requireInput as __require };
