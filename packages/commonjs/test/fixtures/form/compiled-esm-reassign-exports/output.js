import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as inputModule } from "\u0000fixtures/form/compiled-esm-reassign-exports/input.js?commonjs-module";
var input = inputModule.exports;

Object.defineProperty(input, '__esModule', { value: true });
inputModule.exports = { foo: 'bar' };

var inputExports = inputModule.exports;
export default /*@__PURE__*/commonjsHelpers.getDefaultExportFromCjs(inputExports);
export { inputExports as __moduleExports };
