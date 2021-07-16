const a = require('custom-module2');
const b = require('custom-module');

t.is(a.foo, 'baz');
t.is(b.foo, 'bar');
