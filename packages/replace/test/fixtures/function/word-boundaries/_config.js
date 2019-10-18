const assert = require('assert');

module.exports = {
  description: 'uses word boundaries if delimiters are unspecified',
  pluginOptions: { changed: 'replaced' },
  exports(exports) {
    assert.deepEqual(exports, {
      foo: 'unchanged',
      bar: 'replaced'
    });
  }
};
