import { __module as input } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-module"

var getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};
input.exports.getFilePath = getFilePath;

export { exports as __moduleExports } from "\u0000fixtures/form/node-require-methods/input.js?commonjs-module"
export { getFilePath };
export default input.exports;
