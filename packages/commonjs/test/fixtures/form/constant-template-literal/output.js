import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/constant-template-literal/input.js?commonjs-exports";
import require$$0 from "\u0000CWD/fixtures/form/constant-template-literal/tape.js?commonjs-proxy";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var foo = require$$0;
	console.log(foo);
	return input;
}

export { requireInput as __require };
