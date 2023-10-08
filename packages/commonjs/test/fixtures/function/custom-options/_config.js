const path = require('path');
const assert = require('assert');

const ID_MAIN = path.join(__dirname, 'main.js');

const getLastPathFragment = (pathString) => pathString && pathString.split(/[\\/]/).slice(-1)[0];

const resolveIdArgs = [];

module.exports = {
  description: 'passes on isEntry and custom options when resolving via other plugins',
  options: {
    plugins: [
      {
        async buildStart() {
          await this.resolve('./other.js', ID_MAIN, {
            skipSelf: false,
            isEntry: true,
            custom: { test: 42 }
          });
        },
        buildEnd() {
          assert.deepStrictEqual(resolveIdArgs, [
            ['other.js', 'main.js', { attributes: {}, custom: { test: 42 }, isEntry: true }],
            ['main.js', void 0, { attributes: {}, custom: {}, isEntry: true }]
          ]);
        },
        resolveId(source, importer, options) {
          resolveIdArgs.push([getLastPathFragment(source), getLastPathFragment(importer), options]);
        }
      }
    ]
  }
};
