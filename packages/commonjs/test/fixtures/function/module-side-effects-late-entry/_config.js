const path = require('path');
const assert = require('assert');

let referenceId;
const testEntry = 'generated-foo2.js';

module.exports = {
  description:
    'use correct side-effects flags for files that become entry points after they are loaded (strictRequires: false)',
  testEntry,
  options: {
    treeshake: { moduleSideEffects: false },
    plugins: [
      {
        name: 'test',
        load(id) {
          if (id.endsWith('foo.js')) {
            referenceId = this.emitFile({ type: 'chunk', id: path.join(__dirname, 'foo.js') });
          }
        },
        generateBundle() {
          assert.strictEqual(this.getFileName(referenceId), testEntry);
        }
      }
    ],
    output: { chunkFileNames: 'generated-[name].js' }
  },
  pluginOptions: {
    strictRequires: false
  },
  global: (global, t) => {
    t.is(global.foo, 'foo');
  }
};
