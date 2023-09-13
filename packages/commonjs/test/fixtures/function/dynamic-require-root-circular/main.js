/* eslint-disable import/no-dynamic-require, global-require */

const custom = require('custom-module');

t.is(custom.get1(), 'all good');
t.is(custom.get2(), 'indirect ref');
t.is(custom.get3(), custom.get1());
