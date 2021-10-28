if (typeof module.require === 'function' && module.require) {
  module.exports = 'require detected';
} else {
  module.exports = 'could not detect require';
}
