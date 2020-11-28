const getFilePath = function getFilePath(someFile) {
  return require.resolve(someFile);
};

const input = {
  getFilePath
};

export default input;
export { input as __moduleExports };
export { getFilePath };
