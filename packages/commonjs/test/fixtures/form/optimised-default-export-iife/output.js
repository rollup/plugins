import * as commonjsHelpers from "_commonjsHelpers.js";

var input = (function foo () {
  return function fooChild() {};
}());

export default input;
export { input as __moduleExports };
