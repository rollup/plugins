import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/conditional-exports-or-conditional/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var condition1 = typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.env && commonjsHelpers.commonjsGlobal.env.USE_FEATURE_A;
	var condition2 = typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.env && commonjsHelpers.commonjsGlobal.env.USE_FEATURE_B;

	function featureHandler() { return 'feature'; }
	function defaultHandler() { return 'default'; }

	if (condition1 || condition2) {
	  input.handler = featureHandler;
	} else {
	  input.handler = defaultHandler;
	}
	return input;
}

export { requireInput as __require };
