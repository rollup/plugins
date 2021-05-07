import * as commonjsHelpers from "_commonjsHelpers.js";
import { __exports as input } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-exports"

var getFilePath = input.getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};

export default input;
export { input as __moduleExports, getFilePath };
