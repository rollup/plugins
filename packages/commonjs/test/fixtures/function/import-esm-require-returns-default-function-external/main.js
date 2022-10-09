const externalNamed = require('external-esm-named');
const externalMixed = require('external-esm-mixed');
const externalDefault = require('external-esm-default');

t.deepEqual(externalNamed, { foo: 'foo', default: { foo: 'foo' } }, 'named');
t.deepEqual(externalMixed, 'bar', 'mixed');
t.deepEqual(externalDefault, { default: 'bar' }, 'default');
