import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-exports";

var hasRequiredInput;

function requireInput () {
	if (hasRequiredInput) return input;
	hasRequiredInput = 1;
	input.getFilePath = function getFilePath(someFile) {
	  return require.resolve(someFile);
	};
	return input;
}

export { requireInput as __require };
