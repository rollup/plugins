/* eslint-disable */
if (typeof document !== 'undefined') {
  module.exports = document;
} else {
  module.exports = { fake: true };
}
