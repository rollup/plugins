import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/compiled-esm-assign-module/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	input.__esModule = true;
	input.default = 'x';
	input.foo = 'foo';
	return input;
}

export { requireInput as __require };
