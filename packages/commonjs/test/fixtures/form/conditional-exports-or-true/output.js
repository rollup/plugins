import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/conditional-exports-or-true/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var condition = typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.env && commonjsHelpers.commonjsGlobal.env.NODE_ENV;

	function prodHandler() { return 'production'; }
	function defaultHandler() { return 'default'; }

	if (condition || true) {
	  input.handler = prodHandler;
	} else {
	  exports.handler = defaultHandler;
	}
	return input;
}

export { requireInput as __require };
