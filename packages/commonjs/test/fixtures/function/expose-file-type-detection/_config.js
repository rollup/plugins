const path = require('path');

const ID_MAIN = path.join(__dirname, 'main.js');
const ID_OTHER = path.join(__dirname, 'other.js');

module.exports = {
  description: 'exposes cjs file type detection to other plugins',
  options: {
    input: [ID_MAIN, ID_OTHER],
    plugins: [
      {
        moduleParsed({
          id,
          meta: {
            commonjs: { isCommonJS }
          }
        }) {
          if (id === ID_MAIN) {
            if (isCommonJS !== false) {
              throw new Error(
                `Main file wrongly detected: isCommonJS === ${JSON.stringify(isCommonJS)}`
              );
            }
          } else if (isCommonJS !== true) {
            throw new Error(
              `Other file wrongly detected: isCommonJS === ${JSON.stringify(isCommonJS)}`
            );
          }
        }
      }
    ]
  }
};
