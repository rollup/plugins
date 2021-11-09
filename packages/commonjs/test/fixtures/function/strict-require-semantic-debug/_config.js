const assert = require('assert');
const path = require('path');

const warnings = [];

module.exports = {
  description:
    'automatically detects cycles and switches those modules to strict semantics for "debug"',
  pluginOptions: {
    strictRequires: 'debug'
  },
  options: {
    onwarn(warning) {
      if (warning.code === 'CIRCULAR_DEPENDENCY') return;
      if (warning.pluginCode !== 'WRAPPED_IDS') {
        throw new Error(`Unexpected warning ${warning.code}: ${warning.message}`);
      }
      warnings.push(warning);
    }
  },
  exports() {
    assert.strictEqual(warnings.length, 1);
    assert.deepStrictEqual(warnings[0].ids, [
      path.join(__dirname, 'a-imports-b.js'),
      path.join(__dirname, 'b-imports-c.js'),
      path.join(__dirname, 'c-imports-a.js')
    ]);
  }
};
