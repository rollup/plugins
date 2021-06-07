if (globalValue) {
  module.exports = { default: 'first' };
} else {
  module.exports = { default: 'second' };
}

Object.defineProperty(module.exports, '__esModule', { value: true });
