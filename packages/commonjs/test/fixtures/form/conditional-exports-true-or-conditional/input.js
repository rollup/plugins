var condition = typeof global !== 'undefined' && global.env && global.env.DEBUG;

function enabledHandler() { return 'enabled'; }
function disabledHandler() { return 'disabled'; }

if (true || condition) {
  exports.handler = enabledHandler;
} else {
  exports.handler = disabledHandler;
}
