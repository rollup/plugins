import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/conditional-exports-or-false/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	var crypto = (typeof commonjsHelpers.commonjsGlobal !== 'undefined' && commonjsHelpers.commonjsGlobal.crypto) || null;

	function randomFill() { return 'randomFill'; }
	function randomFillSync() { return 'randomFillSync'; }
	function oldBrowser() { throw new Error('not supported'); }

	if ((crypto && crypto.getRandomValues) || false) {
	  input.randomFill = randomFill;
	  input.randomFillSync = randomFillSync;
	} else {
	  input.randomFill = oldBrowser;
	  input.randomFillSync = oldBrowser;
	}
	return input;
}

export { requireInput as __require };
