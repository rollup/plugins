/* eslint-disable global-require */
global.false = false;
global.true = true;

if (global.false) {
  require('./throws.js');
}

if (global.true) {
  /* do nothing */
} else {
  require('./throws.js');
}

const conditionalFalse = global.false ? require('./throws.js') : null;
const conditionalTrue = global.true ? null : require('./throws.js');

const logicalAnd = global.false && require('./throws.js');
const logicalOr = global.true || require('./throws.js');

function requireFunctionDeclaration() {
  require('./throws.js');
}

const requireFunctionExpression = function () {
  require('./throws.js');
};

const requireArrowFunction = () => require('./throws.js');

if (global.false) {
  requireFunctionDeclaration();
  requireFunctionExpression();
  requireArrowFunction();
}

// These should not cause wrapping
t.is(
  (function () {
    return require('./hoisted.js');
  })(),
  'this should be top-level'
);
t.is((() => require('./hoisted.js'))(), 'this should be top-level');
