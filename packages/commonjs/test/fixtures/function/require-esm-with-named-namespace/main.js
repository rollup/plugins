const dep = require('./dep.js');

t.deepEqual(dep, { default: 'default', ns: { default: 'bar', foo: 'foo' } });
