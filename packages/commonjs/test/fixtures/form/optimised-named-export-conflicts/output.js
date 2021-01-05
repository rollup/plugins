import { __module as inputModule, exports as input } from "\u0000fixtures/form/optimised-named-export-conflicts/input.js?commonjs-module"

var foo = 1;
var bar = 2;

var foo_1 = 'a';
input.foo = foo_1;
var bar_1 = 'b';
input.bar = bar_1;

export { input as __moduleExports, foo_1 as foo, bar_1 as bar, input as default };
