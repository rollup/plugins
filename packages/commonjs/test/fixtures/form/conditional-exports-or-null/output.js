import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/conditional-exports-or-null/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var crypto = (typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.crypto) || null;

	function secureHandler() { return 'secure'; }
	function fallbackHandler() { return 'fallback'; }

	if ((crypto && crypto.getRandomValues) || null) {
	  input.handler = secureHandler;
	} else {
	  input.handler = fallbackHandler;
	}
	return input;
}

export { requireInput as __require };
