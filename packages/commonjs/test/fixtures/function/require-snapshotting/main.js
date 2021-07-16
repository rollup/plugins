const dep = require('./dep.js');

t.is(dep.foo, 'foo');

dep.update();

t.is(dep.foo, 'foo');
t.is(require('./dep.js').foo, 'bar');
