import * as commonjsHelpers from "_commonjsHelpers.js";
import require$$0 from "\u0000CWD/fixtures/form/multi-entry-module-exports/input2.js?commonjs-proxy";

var input1;
var hasRequiredInput1;

function requireInput1 () {
	if (hasRequiredInput1) return input1;
	hasRequiredInput1 = 1;
	const t2 = require$$0;

	console.log(t2);
	input1 = 1;
	return input1;
}

export { requireInput1 as __require };
