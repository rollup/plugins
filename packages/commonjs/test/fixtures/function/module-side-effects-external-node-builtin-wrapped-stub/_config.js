module.exports = {
  description:
    "uses 'stub' proxy for external node: builtins when configured, avoiding node:module import",
  pluginOptions: {
    strictRequires: true,
    externalBuiltinsRequire: 'stub'
  },
  context: {
    __filename: __filename
  }
};
