// Ensure the transform computes `wrappedModuleSideEffects` for an external
// wrapped dependency by including a Node builtin `require()` inside a function.
function unused() {
  // External Node builtin require – converted to an external proxy.
  // When `externalBuiltinsRequire: 'stub'`, calling this will throw; we
  // invoke it inside a try/catch below so the test can snapshot the emitted
  // stub proxy without failing at runtime.
  require('node:crypto');
}

try {
  unused();
} catch (_err) {
  // Expected: in this fixture we configure `externalBuiltinsRequire: 'stub'`,
  // so calling the proxy's `__require()` throws. We swallow the error so the
  // test can assert on the generated code (no `node:module` import) without
  // failing at runtime.
}

module.exports = 1;
