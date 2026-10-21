// Since Node 23,the namespace of an imported CommonJS module carries a 'module.exports' key,
// so it never has `default` as its only key and the "auto" unwrapping failed.
// https://github.com/nodejs/node/pull/53848
module.exports = {
  description:
    'returns `module.exports` when requiring an external CommonJS module through a Node >= 23 namespace and requireReturnsDefault is "auto"',
  options: {
    external: [
      'external-cjs-node23-constructor',
      'external-cjs-node23-named',
      'external-cjs-node23-nan',
      'external-esm-module-exports-key'
    ]
  },
  pluginOptions: {
    requireReturnsDefault: 'auto',
    esmExternals: true
  }
};
