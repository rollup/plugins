import * as external from 'external-esm-named';

import * as dep from './dep';

t.deepEqual(dep, {
  default: {
    named: 'named'
  },
  named: 'named'
});

t.deepEqual(external, {
  foo: 'foo'
});
