module.exports = {
  description: "hoists external node built-in requires when requireNodeBuiltins is false (default)",
  pluginOptions: {
    strictRequires: true,
    requireNodeBuiltins: false
  },
  exports: (exports, t) => {
    t.is(exports, 42);
  }
};
