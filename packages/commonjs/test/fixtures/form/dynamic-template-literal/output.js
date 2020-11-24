import * as commonjsHelpers from "_commonjsHelpers.js";
import { __module as input } from "\u0000fixtures/form/dynamic-template-literal/input.js?commonjs-module"

var pe = 'pe';
var foo = commonjsHelpers.commonjsRequire(`ta${pe}`);
console.log(foo);

export { exports as __moduleExports } from "\u0000fixtures/form/dynamic-template-literal/input.js?commonjs-module"
export default input.exports;
