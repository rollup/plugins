const foo = require('./foo');

const obj = {};
foo.call(obj);

t.is(obj.x, 'x');
t.is(this.y, 'y');
