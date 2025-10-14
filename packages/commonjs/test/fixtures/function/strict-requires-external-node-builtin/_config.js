module.exports = {
  description: "does not hoist external node built-in requires when strictRequires is true",
  pluginOptions: {
    strictRequires: true
  },
  exports: (exports, t) => {
    t.is(exports, 42);
  }
};
