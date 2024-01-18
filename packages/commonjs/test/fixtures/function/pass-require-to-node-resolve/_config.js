const assert = require('assert');

module.exports = {
  description: 'notifies the node-resolve plugin if an id is imported via "require"',
  options: {
    plugins: [
      {
        name: 'node-resolve-mock',
        resolveId(source, importer, options) {
          const { isRequire } = options.custom?.['node-resolve'] || {};
          if (source === './foo') {
            return this.resolve(isRequire ? './foo-required' : './foo-imported', importer, options);
          }
          if (source === './bar') {
            return this.resolve(isRequire ? './bar-required' : './bar-imported', importer, options);
          }
          return null;
        }
      }
    ]
  },
  async exports(exports) {
    assert.deepStrictEqual(await exports, [{ default: 'imported' }, { default: 'imported' }]);
  }
};
