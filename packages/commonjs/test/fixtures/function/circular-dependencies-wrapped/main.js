const dep = require('./dep.js');

addExports(exports);
t.is(dep.getMain().foo, 'foo');

function addExports(exported) {
  // eslint-disable-next-line no-param-reassign
  exports.foo = 'foo';
}
