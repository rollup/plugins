const bind = require('./dep.js');

function f() {
  return this || 0;
}

const fBound = Reflect.apply(bind, Function.prototype.call, [f, 42])

module.exports = fBound();