module.exports = {
  description: 'handles node: builtins correctly with strictRequires: auto and requireNodeBuiltins: false (default)',
  pluginOptions: {
    strictRequires: 'auto',
    requireNodeBuiltins: false
  },
  exports: (exports, t) => {
    // Should be able to access properties of node:stream
    t.truthy(exports.Readable);
    t.is(typeof exports.Readable, 'function');
    // Should be able to instantiate
    t.truthy(exports.readable);
  }
};
