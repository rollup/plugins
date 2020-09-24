module.exports.getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};
