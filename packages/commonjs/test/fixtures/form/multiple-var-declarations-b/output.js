import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations-b/input.js?commonjs-exports";
import require$$0 from "\u0000CWD/fixtures/form/multiple-var-declarations-b/a.js?commonjs-proxy";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var a = require$$0
	  , b = 42;

	console.log( a, b );
	return input;
}

export { requireInput as __require };
