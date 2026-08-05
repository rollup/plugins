/* eslint-disable global-require */

let handled = 'no error';

try {
  handled = 'no error';
} catch (error) {
  // The handler never runs here, but the require must still stay inside it. Hoisting it
  // to a top-level import would make this module fail to evaluate at all.
  handled = require('uninstalled-external-module');
}

t.is(handled, 'no error');
