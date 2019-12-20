module.exports = {
  options: {
    external: ['foo']
  },
  exports: (exports, t) => {
    t.is(exports, 'foo');
  }
};
