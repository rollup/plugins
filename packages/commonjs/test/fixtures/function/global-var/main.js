/* eslint-disable */
function foo() {
  const a = 1;
  const global = {};
  global.modified = true;
  return global;
}

const notGlobal = foo();
t.truthy(notGlobal.modified);
t.truthy(!global.modified);

module.exports = {};
