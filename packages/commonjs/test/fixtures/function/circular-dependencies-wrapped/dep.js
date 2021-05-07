const main = require('./main.js');

addExports(exports);

function addExports(exported) {
  // eslint-disable-next-line no-param-reassign
  exported.getMain = () => main;
}
