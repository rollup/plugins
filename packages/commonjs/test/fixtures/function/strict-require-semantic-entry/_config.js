const assert = require('assert');

module.exports = {
  description: 'strict require semantic modules can be entry points',
  options: {
    input: [
      'fixtures/function/strict-require-semantic-entry/main.js',
      'fixtures/function/strict-require-semantic-entry/other.js'
    ],
    output: {
      chunkFileNames: 'generated-[name].js'
    }
  },
  pluginOptions: {
    strictRequires: ['fixtures/function/strict-require-semantic-entry/main.js']
  },
  exports(exports) {
    assert.deepStrictEqual(exports, { foo: 'foo' });
  }
};
