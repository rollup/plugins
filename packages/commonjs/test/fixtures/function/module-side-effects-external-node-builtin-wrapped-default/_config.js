module.exports = {
  description:
    'does not crash and does not mark external node: builtins as pure when strictRequires is true and requireNodeBuiltins is false (default)',
  pluginOptions: {
    strictRequires: true,
    requireNodeBuiltins: false
  },
  context: {
    __filename: __filename
  }
};
