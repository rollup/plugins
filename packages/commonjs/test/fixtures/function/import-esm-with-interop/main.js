/* eslint-disable */
var lib = require('./lib.js');

function _interopDefault(e) {
  return e && e.__esModule ? e : { default: e };
}

var lib__default = /*#__PURE__*/_interopDefault(lib);
t.is(lib__default['default'], 'foo')
t.is(lib.bar, 'bar')

lib.update('newFoo', 'newBar');
t.is(lib__default['default'], 'newFoo')
t.is(lib.bar, 'newBar')

