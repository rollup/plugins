const assert = require('assert');

const warnings = [];

module.exports = {
  description: 'Warns when another plugin uses this.resolve without forwarding options',
  options: {
    onwarn(warning) {
      warnings.push(warning);
    },
    plugins: [
      {
        name: 'test',
        resolveId(source, importer) {
          return this.resolve(source, importer, { skipSelf: true });
        },
        buildEnd() {
          assert.strictEqual(warnings.length, 1);
          assert.strictEqual(
            warnings[0].message,
            'It appears a plugin has implemented a "resolveId" hook that uses "this.resolve" without forwarding the third "options" parameter of "resolveId". This is problematic as it can lead to wrong module resolutions especially for the node-resolve plugin and in certain cases cause early exit errors for the commonjs plugin.\nIn rare cases, this warning can appear if the same file is both imported and required from the same mixed ES/CommonJS module, in which case it can be ignored.'
          );
          assert.strictEqual(warnings[0].pluginCode, 'THIS_RESOLVE_WITHOUT_OPTIONS');
          assert.strictEqual(warnings[0].url, 'https://rollupjs.org/guide/en/#resolveid');
        }
      }
    ]
  }
};
