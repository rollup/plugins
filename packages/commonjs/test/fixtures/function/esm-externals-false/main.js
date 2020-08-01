const externalExports = require('external-cjs-exports');
const externalModuleExports = require('external-cjs-module-exports');
const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');

t.deepEqual(externalExports, { foo: 'foo' }, 'external exports');
t.deepEqual(externalModuleExports, 'bar', 'external module exports');
t.deepEqual(externalNamed, { foo: 'foo' }, 'external named');
t.deepEqual(externalMixed, 'bar', 'external mixed');
t.deepEqual(externalDefault, 'bar', 'external default');
