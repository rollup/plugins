const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');

const namedExports = require('./named.js');
const mixedExports = require('./mixed.js');
const defaultExport = require('./default.js');
const noExports = require('./none.js');

t.deepEqual(namedExports, { foo: 'foo' }, 'named exports');
t.deepEqual(mixedExports, { foo: 'foo', default: 'bar' }, 'mixed exports');
t.deepEqual(defaultExport, { default: 'bar' }, 'default export');
t.deepEqual(noExports, {}, 'no exports');
t.deepEqual(externalNamed, { foo: 'foo' }, 'external named');
t.deepEqual(externalMixed, { foo: 'foo', default: 'bar' }, 'external mixed');
t.deepEqual(externalDefault, { default: 'bar' }, 'external default');

/* eslint-disable no-prototype-builtins */
t.is(namedExports.hasOwnProperty('foo'), true);
t.is(mixedExports.hasOwnProperty('foo'), true);
t.is(defaultExport.hasOwnProperty('foo'), false);
t.is(externalNamed.hasOwnProperty('foo'), true);
t.is(externalMixed.hasOwnProperty('foo'), true);
t.is(externalDefault.hasOwnProperty('foo'), false);
