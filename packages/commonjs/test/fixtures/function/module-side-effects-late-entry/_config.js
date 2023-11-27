const path = require('path');

module.exports = {
  description:
    'use correct side-effects flags for files that become entry points after they are loaded (strictRequires: "auto")',
  options: {
    treeshake: { moduleSideEffects: false },
    plugins: [
      {
        load(id) {
          if (id.endsWith('foo.js')) {
            this.emitFile({ type: 'chunk', id: path.join(__dirname, 'foo.js') });
          }
        }
      }
    ],
    output: { chunkFileNames: 'generated-[name].js' }
  },
  pluginOptions: {
    strictRequires: 'auto'
  },
  global: (global, t) => {
    t.is(global.foo, 'foo');
  }
};
