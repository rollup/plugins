// Top-level require of a Node builtin ensures the transform computes
// wrappedModuleSideEffects for an external wrapped dependency.
function unused() {
  // External Node builtin require; not executed at runtime
  require('node:crypto');
}

module.exports = 1;
