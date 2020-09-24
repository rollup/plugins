const other = require('dep_other.js');
const both = require('dep_both.js');

t.deepEqual(other, 'other.js', 'other other');
t.deepEqual(both, 'both.js', 'other both');
