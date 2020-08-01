import { other } from './dep.js';

const dep = require('./dep.js');

t.is(other, 'other');
t.deepEqual(dep, { other: 'other' });
