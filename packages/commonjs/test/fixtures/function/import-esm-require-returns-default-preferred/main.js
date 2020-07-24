const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');
const namedExports = require('./named.js');
const mixedExports = require('./mixed.js');
const defaultExport = require('./default.js');

t.deepEqual(namedExports, { foo: 'foo' }, 'named exports');
t.deepEqual(mixedExports, 'bar', 'mixed exports');
t.deepEqual(defaultExport, 'bar', 'default export');
t.deepEqual(externalNamed, { foo: 'foo' }, 'external named');
t.deepEqual(externalMixed, 'bar', 'external mixed');
t.deepEqual(externalDefault, 'bar', 'external default');
