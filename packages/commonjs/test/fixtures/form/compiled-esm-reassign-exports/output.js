import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule, exports as input } from "\u0000fixtures/form/compiled-esm-reassign-exports/input.js?commonjs-module"

Object.defineProperty(input, '__esModule', { value: true });
inputModule.exports = { foo: 'bar' };

export default /*@__PURE__*/commonjsHelpers.getDefaultExportFromCjs(input);
export { input as __moduleExports };
