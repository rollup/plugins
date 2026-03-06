import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/conditional-exports-true-or-conditional/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var condition = typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.env && commonjsHelpers.commonjsGlobal.env.DEBUG;

	function enabledHandler() { return 'enabled'; }
	function disabledHandler() { return 'disabled'; }

	if (true || condition) {
	  input.handler = enabledHandler;
	} else {
	  exports.handler = disabledHandler;
	}
	return input;
}

export { requireInput as __require };
