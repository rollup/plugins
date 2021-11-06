exports.foo = 'foo';
t.is(require('./other.js').foo, 'foo');
