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
          assert.strictEqual(warnings.length, 1);
          assert.strictEqual(warnings[0].code, 'UNRESOLVED_IMPORT');
          assert.strictEqual(warnings[0].source, 'path');
        }
      }
    ]
  }
};
