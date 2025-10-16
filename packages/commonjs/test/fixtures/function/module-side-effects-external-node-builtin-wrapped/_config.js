module.exports = {
  description:
    'does not crash and does not mark external node: builtins as pure when strictRequires is true',
  pluginOptions: {
    strictRequires: true
  },
  context: {
    __filename: __filename
  }
};
