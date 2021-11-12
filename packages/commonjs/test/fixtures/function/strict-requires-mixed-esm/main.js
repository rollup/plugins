import esm from './import.js';

const cjs = require('./require.js');

t.is(esm.foo, 'foo');
t.is(cjs.foo, 'foo');
