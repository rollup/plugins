import * as commonjsHelpers from "_commonjsHelpers.js";

var input2;
var hasRequiredInput2;

function requireInput2 () {
	if (hasRequiredInput2) return input2;
	hasRequiredInput2 = 1;
	input2 = {
	  a: 2
	};
	return input2;
}

export { requireInput2 as __require };
