const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');
const mixedExports = require('./mixed.js');
const defaultExport = require('./default.js');

t.deepEqual(mixedExports, 'bar', 'mixed exports');
t.deepEqual(defaultExport, 'bar', 'default export');
t.deepEqual(externalNamed, { foo: 'foo' }, 'external named');
t.deepEqual(externalMixed, 'bar', 'external mixed');
t.deepEqual(externalDefault, 'bar', 'external default');
