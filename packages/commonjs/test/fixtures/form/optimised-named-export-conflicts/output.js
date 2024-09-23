import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/optimised-named-export-conflicts/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var foo = 1;
	var bar = 2;

	input.foo = 'a';
	input.bar = 'b';
	return input;
}

export { requireInput as __require };
