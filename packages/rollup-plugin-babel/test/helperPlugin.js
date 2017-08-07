module.exports = function importHelperPlugin () {
  return {
    visitor: {
      ClassDeclaration (path, state) {
        path.replaceWith(state.file.addHelper('classCallCheck'));
      }
    }
  };
}
