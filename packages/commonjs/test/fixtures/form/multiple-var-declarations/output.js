import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/multiple-var-declarations/input.js?commonjs-exports";
import require$$0 from "\u0000CWD/fixtures/form/multiple-var-declarations/a.js?commonjs-proxy";
import require$$1 from "\u0000CWD/fixtures/form/multiple-var-declarations/b.js?commonjs-proxy";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var a = require$$0()
	  , b = require$$1;

	console.log( a, b );
	return input;
}

export { requireInput as __require };
