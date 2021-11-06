import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule, exports as input } from "\u0000fixtures/form/defaultIsModuleExports-false-reassign-exports-__esModule/input.js?commonjs-module"

(function (module) {
	module.exports = { __esModule: true, default: { foo: 'bar' }};
} (inputModule));

export default input.default;
export { input as __moduleExports };
