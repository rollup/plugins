exports.foo = 'first';

reassignSomeExports();
reassignSomeMoreExports();

function reassignSomeExports() {
  exports.foo = 'second';
  exports.bar = 'first';
}

function reassignSomeMoreExports() {
  exports.bar = 'second';
}
