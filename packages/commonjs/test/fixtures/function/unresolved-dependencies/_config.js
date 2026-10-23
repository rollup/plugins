const assert = require('assert');

const { VERSION } = require('rollup');

const [rollupMajor] = VERSION.split('.').map(Number);

const warnings = [];

module.exports = {
  description: 'handles unresolved dependencies with the proper warning',
  options: {
    onwarn(warning) {
      warnings.push(warning);
    },
    plugins: [
      {
        buildEnd() {
          assert.deepStrictEqual(
            warnings.map(({ code, exporter, ...rest }) => {
              return { code, exporter };
            }),
            [{ code: 'UNRESOLVED_IMPORT', exporter: rollupMajor >= 3 ? 'path' : undefined }]
          );
        }
      }
    ]
  }
};
