import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/optimised-named-export-conflicts/input.js?commonjs-exports"

var foo = 1;
var bar = 2;

var foo_1 = input.foo = 'a';
var bar_1 = input.bar = 'b';

export { input as __moduleExports, foo_1 as foo, bar_1 as bar, input as default };
