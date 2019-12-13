/* eslint-disable */
if ('development' === 'production') {
  require('./a.js');
}

module.exports = true ? require('./b.js') : require('./c.js');
