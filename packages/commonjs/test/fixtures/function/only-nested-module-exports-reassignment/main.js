const dep1 = require('./dep1.js');
const dep2 = require('./dep2.js');

t.is(dep1, 'reassigned');
t.deepEqual(dep2, {});
