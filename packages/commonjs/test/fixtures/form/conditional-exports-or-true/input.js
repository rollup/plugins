var condition = typeof global !== 'undefined' && global.env && global.env.NODE_ENV;

function prodHandler() { return 'production'; }
function defaultHandler() { return 'default'; }

if (condition || true) {
  exports.handler = prodHandler;
} else {
  exports.handler = defaultHandler;
}
