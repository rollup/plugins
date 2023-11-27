const assert = require('assert');

module.exports = {
  description: 'notifies the node-resolve plugin if an id is imported via "require" (strictRequires: "auto")',
  options: {
    plugins: [
      {
        name: 'node-resolve-mock',
        resolveId(source, importer, { custom }) {
          const { isRequire } = (custom && custom['node-resolve']) || {};
          if (source === './foo') {
            return this.resolve(isRequire ? './foo-required' : './foo-imported', importer);
          }
          if (source === './bar') {
            return this.resolve(isRequire ? './bar-required' : './bar-imported', importer);
          }
          return null;
        }
      }
    ]
  },
  pluginOptions: {
    strictRequires: 'auto'
  },
  async exports(exports) {
    assert.deepStrictEqual(await exports, [{ default: 'imported' }, { default: 'imported' }]);
  }
};
