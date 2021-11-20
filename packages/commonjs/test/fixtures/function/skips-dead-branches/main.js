/* eslint-disable */
if ('development' === 'production') {
  require('./a.js');
}

exports.conditionalTrue = true ? require('./b.js') : require('./c.js');
exports.conditionalFalse = false ? require('./c.js') : require('./b.js');
exports.logicalAnd1 = true && require('./b.js');
exports.logicalAnd2 = false && require('./c.js');
exports.logicalOr1 = true || require('./c.js');
exports.logicalOr2 = false || require('./b.js');
