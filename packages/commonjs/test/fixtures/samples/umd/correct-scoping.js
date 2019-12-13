if (typeof require === 'function') {
  module.exports = (function(require) {
    return typeof require;
  })({});
}
