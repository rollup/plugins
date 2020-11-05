var getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};

var input = {
	getFilePath: getFilePath
};

export default input;
export { input as __moduleExports };
export { getFilePath };
