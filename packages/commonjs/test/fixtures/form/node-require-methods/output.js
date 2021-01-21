import { __exports as input } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-exports"

var getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};
input.getFilePath = getFilePath;

export { input as __moduleExports, getFilePath, input as default };
