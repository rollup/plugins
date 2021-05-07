exports.foo = 'first';

reassignSomeExports();
reassignSomeMoreExports();

function reassignSomeExports() {
  // To test deconflicting
  const foo = null;
  const dep1 = null;
  exports.foo = 'second';
  exports.bar = 'first';
}

function reassignSomeMoreExports() {
  exports.bar = 'second';
}
