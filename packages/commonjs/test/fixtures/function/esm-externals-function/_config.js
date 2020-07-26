const assert = require('assert');

const called = {};

module.exports = {
  description: 'always uses the default export when esmExternals is not used',
  options: {
    external: [
      'external-cjs-exports',
      'external-cjs-module-exports',
      'external-esm-named',
      'external-esm-mixed',
      'external-esm-default'
    ],
    plugins: [
      {
        name: 'test-plugin',
        buildEnd() {
          assert.deepStrictEqual(called, {
            'external-cjs-exports': 1,
            'external-cjs-module-exports': 1,
            'external-esm-named': 1,
            'external-esm-mixed': 1,
            'external-esm-default': 1
          });
        }
      }
    ]
  },
  pluginOptions: {
    esmExternals: (id) => {
      called[id] = (called[id] || 0) + 1;
      return id === 'external-esm-default';
    }
  }
};
