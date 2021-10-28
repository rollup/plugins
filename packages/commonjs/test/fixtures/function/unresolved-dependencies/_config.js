const assert = require('assert');

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
            warnings.map(({ code, source }) => {
              return { code, source };
            }),
            [{ code: 'UNRESOLVED_IMPORT', source: 'path' }]
          );
        }
      }
    ]
  }
};
