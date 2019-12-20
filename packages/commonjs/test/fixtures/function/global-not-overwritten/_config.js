module.exports = {
  exports(exports, t) {
    t.is(exports.encoded, encodeURIComponent('test string'));
  }
};
