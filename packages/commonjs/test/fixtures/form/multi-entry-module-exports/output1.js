import * as commonjsHelpers from "_commonjsHelpers.js";
import require$$0 from "\u0000CWD/fixtures/form/multi-entry-module-exports/input2.js?commonjs-proxy";

const t2 = require$$0;

console.log(t2);
var input1 = 1;

export default input1;
export { input1 as __moduleExports };
