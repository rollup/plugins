const path = require('path');
const fs = require('fs');

const ID_MAIN = path.join(__dirname, 'main.js');
const ID_OTHER = path.join(__dirname, 'other.js');

module.exports = {
  options: {
    input: [ID_MAIN, ID_OTHER],
    plugins: [
      {
        load(id) {
          if (id === ID_MAIN) {
            return new Promise((resolve) =>
              setTimeout(() => resolve(fs.readFileSync(ID_MAIN, 'utf8')), 100)
            );
          }
          return null;
        }
      }
    ]
  }
};
