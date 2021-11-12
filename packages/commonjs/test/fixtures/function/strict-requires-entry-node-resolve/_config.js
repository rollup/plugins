const assert = require('assert');

const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  description:
    'strict require semantic modules can be entry points when the node-resolve plugin is used',
  pluginOptions: {
    strictRequires: true
  },
  options: {
    plugins: [
      {
        name: 'before-node',
        buildStart({ plugins }) {
          assert.deepStrictEqual(
            plugins.map((plugin) => plugin.name),
            ['commonjs--resolver', 'before-node', 'node-resolve', 'after-node', 'commonjs']
          );
        }
      },
      nodeResolve(),
      {
        name: 'after-node'
      }
    ]
  },
  exports(exports) {
    assert.deepStrictEqual(exports, { foo: 'foo' });
  }
};
