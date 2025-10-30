module.exports = {
  description: "does not hoist external node built-in requires when strictRequires is true",
  pluginOptions: {
    strictRequires: true,
    requireNodeBuiltins: true
  },
  exports: (exports, t) => {
    t.is(exports, 42);
  }
};
