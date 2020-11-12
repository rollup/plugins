exports.default = 42;

addCompiledMarker(module.exports);

function addCompiledMarker(exports) {
  // eslint-disable-next-line no-param-reassign
  exports.__esModule = true;
}
