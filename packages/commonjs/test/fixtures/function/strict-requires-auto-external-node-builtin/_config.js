module.exports = {
  description: 'handles node: builtins correctly with strictRequires: auto',
  pluginOptions: {
    strictRequires: 'auto',
    requireNodeBuiltins: true
  },
  exports: (exports, t) => {
    // Should be able to access properties of node:stream
    t.truthy(exports.Readable);
    t.is(typeof exports.Readable, 'function');
    // Should be able to instantiate
    t.truthy(exports.readable);
  }
};
