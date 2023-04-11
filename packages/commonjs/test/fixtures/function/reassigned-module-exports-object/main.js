const dep = require('./dep');

t.deepEqual(dep, { foo: 'foo' }, 'imported in main.js');
