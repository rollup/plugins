let foo = require('./foo.js');

if (!foo.something) {
  foo = function somethingElse() {};
  foo.something = true;
}

t.truthy(foo.something);
