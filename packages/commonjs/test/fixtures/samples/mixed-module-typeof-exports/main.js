const foo = require('./foo');

if (typeof exports !== 'undefined') {
  throw new Error('There should be no global exports in an ES module');
}

export { foo as default };
