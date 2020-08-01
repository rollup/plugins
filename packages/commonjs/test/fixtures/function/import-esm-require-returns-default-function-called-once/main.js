require('./other.js');

const main = require('dep_main.js');
const both = require('dep_both.js');

t.deepEqual(main, 'main.js', 'main main');
t.deepEqual(both, 'both.js', 'main both');
