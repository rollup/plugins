import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/defaultIsModuleExports-auto-no-__esModule/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	input.default = 2;
	input.named = 3;
	return input;
}

export { requireInput as __require };
