if (typeof someUnknownGlobal !== 'undefined') {
  module.exports = { named: 'bar' };
} else {
  module.exports = { named: 'foo' };
}
