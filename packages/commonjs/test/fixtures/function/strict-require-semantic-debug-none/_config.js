const assert = require('assert');

const warnings = [];

module.exports = {
  description: 'has correct debug output when there are no cycles',
  pluginOptions: {
    strictRequires: 'debug'
  },
  options: {
    onwarn(warning) {
      if (warning.pluginCode !== 'WRAPPED_IDS') {
        throw new Error(`Unexpected warning ${warning.code}: ${warning.message}`);
      }
      warnings.push(warning);
    }
  },
  exports() {
    assert.strictEqual(warnings.length, 1);
    assert.deepStrictEqual(warnings[0].ids, []);
    assert.strictEqual(warnings[0].message, 'The commonjs plugin did not wrap any files.');
  }
};
