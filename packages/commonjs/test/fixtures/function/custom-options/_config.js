const path = require('path');
const assert = require('assert');

const { VERSION } = require('rollup');

const [rollupMajor, rollupMinor] = VERSION.split('.').map(Number);

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
          const resolveIdOptions = (custom) => {
            const options = { custom, isEntry: true };
            if (rollupMajor < 4) {
              return options;
            }
            // rollup 4.57.0 adds "importerAttributes" as an own property to resolveId options
            return rollupMajor > 4 || (rollupMajor === 4 && rollupMinor >= 57)
              ? { attributes: {}, importerAttributes: undefined, ...options }
              : { attributes: {}, ...options };
          };

          assert.deepStrictEqual(resolveIdArgs, [
            ['other.js', 'main.js', resolveIdOptions({ test: 42 })],
            ['main.js', void 0, resolveIdOptions({})]
          ]);
        },
        resolveId(source, importer, options) {
          resolveIdArgs.push([getLastPathFragment(source), getLastPathFragment(importer), options]);
        }
      }
    ]
  }
};
