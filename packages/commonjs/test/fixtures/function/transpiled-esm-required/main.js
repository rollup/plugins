const dep = require('./dep');

t.deepEqual(dep, {
  default: 'default',
  named: 'named'
});

// eslint-disable-next-line no-prototype-builtins
t.is(dep.hasOwnProperty('named'), true);
