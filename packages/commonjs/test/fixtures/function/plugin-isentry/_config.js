const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ID_MAIN = path.join(__dirname, 'main.js');
const ID_OTHER = path.join(__dirname, 'other.js');

module.exports = {
  description: 'provides correct values for ModuleInfo.isEntry to not break legacy plugins',
  options: {
    input: [ID_MAIN, ID_OTHER],
    output: {
      chunkFileNames: '[name].js'
    },
    plugins: [
      {
        transform(code, id) {
          if (this.getModuleInfo(id).isEntry) {
            return `import "polyfill";\n${code}`;
          }
          return null;
        },
        resolveId(id) {
          if (id === 'polyfill') return id;
          return null;
        },
        load(id) {
          if (id === 'polyfill') {
            return `global.entryDetected = true;`;
          }
          return null;
        }
      }
    ]
  }
};
