const dep1 = require('./dep1.js');
const dep2 = require('./dep2.js');
const dep3 = require('./dep3.js');
const dep4 = require('./dep4.js');

t.is(dep1, 'reassigned');
t.is(dep2, 'original');
t.is(dep3, 'final');
t.is(dep4, 'final');
