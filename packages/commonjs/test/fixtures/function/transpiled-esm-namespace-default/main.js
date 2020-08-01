import * as external from 'external-esm-default';

import * as dep from './dep';

t.deepEqual(dep, {
  default: 'default'
});

t.deepEqual(external, {
  default: 'bar'
});
