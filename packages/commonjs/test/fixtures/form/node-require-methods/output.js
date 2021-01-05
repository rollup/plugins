import { __module as inputModule, exports as input } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-module"

var getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};
input.getFilePath = getFilePath;

export { input as __moduleExports, getFilePath, input as default };
