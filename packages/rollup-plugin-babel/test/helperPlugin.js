module.exports = function importHelperPlugin () {
  return {
    visitor: {
      Program (path, state) {
        state.file.addHelper('classCallCheck');
      }
    }
  };
}
