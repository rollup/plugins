const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');

t.deepEqual(externalNamed, { foo: 'foo' }, 'external named');
t.deepEqual(externalMixed, { default: 'bar', foo: 'foo' }, 'external mixed');
t.deepEqual(externalDefault, { default: 'bar' }, 'external default');
