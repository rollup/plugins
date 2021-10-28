import * as commonjsHelpers from "_commonjsHelpers.js";
import { commonjsRequire as commonjsRequire } from "_commonjs-dynamic-modules";
import { __exports as input } from "\u0000fixtures/form/dynamic-template-literal/input.js?commonjs-exports"

var pe = 'pe';
var foo = commonjsRequire(`ta${pe}`);
console.log(foo);

export { input as __moduleExports, input as default };
