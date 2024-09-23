import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input_1 } from "\u0000fixtures/form/no-exports-entry/input.js?commonjs-exports";
import require$$0 from "\u0000CWD/fixtures/form/no-exports-entry/dummy.js?commonjs-proxy";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input_1;
	hasRequiredInput = 1;
	var dummy = require$$0;

	var foo = function () {
		return;
	};

	var input = 42;
	return input_1;
}

export { requireInput as __require };
