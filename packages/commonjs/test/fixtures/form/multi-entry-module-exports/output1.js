import { __module as input1 } from "\u0000fixtures/form/multi-entry-module-exports/input1.js?commonjs-module"
import "\u0000./input2.js?commonjs-require";
import t2 from "\u0000./input2.js?commonjs-proxy";

console.log(t2);
input1.exports = 1;

export { exports as __moduleExports } from "\u0000fixtures/form/multi-entry-module-exports/input1.js?commonjs-module"
export default input1.exports;
