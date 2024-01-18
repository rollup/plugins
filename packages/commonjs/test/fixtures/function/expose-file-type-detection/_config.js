const path = require('path');

const ID_MAIN = path.join(__dirname, 'main.js');
const ID_OTHER = path.join(__dirname, 'other.js');

module.exports = {
  description: 'exposes cjs file type detection to other plugins',
  options: {
    input: [ID_MAIN, ID_OTHER],
    plugins: [
      {
        moduleParsed({ id, meta: { commonjs } }) {
          if (id === ID_OTHER) {
            if (commonjs.isCommonJS !== 'withRequireFunction') {
              throw new Error(
                `File "${id}" wrongly detected: isCommonJS === ${JSON.stringify(
                  commonjs.isCommonJS
                )} instead of "withRequireFunction"`
              );
            }
          } else if (commonjs && !!commonjs.isCommonJS) {
            throw new Error(
              `File "${id}" wrongly detected: isCommonJS === ${JSON.stringify(
                commonjs.isCommonJS
              )} instead of false`
            );
          }
        }
      }
    ]
  }
};
