function foo(require) {
  require('not-an-actual-require-statement');
}

let result;

foo((msg) => {
  result = msg;
});

t.is(result, 'not-an-actual-require-statement');
