const bar = require('./bar');

module.exports = 'bar';
if (bar()) {
  return;
}
module.exports = 'foo';
