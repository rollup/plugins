const assert = require('assert');

const { VERSION } = require('rollup');

const [rollupMajor, rollupMinor] = VERSION.split('.').map(Number);

// rollup 4.13.0 augments plugin warnings with a "[plugin commonjs] " prefix
const messagePrefix =
  rollupMajor > 4 || (rollupMajor === 4 && rollupMinor >= 13) ? '[plugin commonjs] ' : '';

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
    assert.strictEqual(
      warnings[0].message,
      `${messagePrefix}The commonjs plugin did not wrap any files.`
    );
  }
};
