var condition1 = typeof global !== 'undefined' && global.env && global.env.USE_FEATURE_A;
var condition2 = typeof global !== 'undefined' && global.env && global.env.USE_FEATURE_B;

function featureHandler() { return 'feature'; }
function defaultHandler() { return 'default'; }

if (condition1 || condition2) {
  exports.handler = featureHandler;
} else {
  exports.handler = defaultHandler;
}
