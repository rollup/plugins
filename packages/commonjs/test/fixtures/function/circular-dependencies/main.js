const dep = require('./dep.js');

exports.foo = 'foo';
t.is(dep.getMain().foo, 'foo');
