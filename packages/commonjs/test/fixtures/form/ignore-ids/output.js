import { __module as input } from "\u0000fixtures/form/ignore-ids/input.js?commonjs-module"
import "\u0000bar?commonjs-require";
import bar from "\u0000bar?commonjs-proxy";

var foo = require( 'foo' );

export { exports as __moduleExports } from "\u0000fixtures/form/ignore-ids/input.js?commonjs-module"
export default input.exports;
