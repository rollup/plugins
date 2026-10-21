const ExternalCtor = require('external-cjs-node23-constructor');
const namedExports = require('external-cjs-node23-named');
const esmNamespace = require('external-esm-module-exports-key');
const nanExport = require('external-cjs-node23-nan');

t.is(typeof ExternalCtor, 'function', 'unwraps `module.exports` instead of returning the namespace');
t.is(new ExternalCtor('foo').value, 'foo', 'the required value is constructable');
t.deepEqual(
  namedExports,
  { foo: 'foo' },
  'returns `module.exports` even when named exports were detected'
);
t.deepEqual(
  esmNamespace,
  { default: 'bar', foo: 'foo', 'module.exports': 'not-the-default' },
  'keeps the namespace of an ES module that exports a binding named "module.exports"'
);
t.is(nanExport, NaN, 'unwraps `module.exports` when the exported value is NaN');
