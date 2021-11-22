t.is(
  require('custom-module')(),
  '/fixtures/function/dynamic-require-resolve-reference/node_modules/custom-module2'
);
t.is(
  require('custom-module2')(),
  '/fixtures/function/dynamic-require-resolve-reference/node_modules/custom-module'
);
