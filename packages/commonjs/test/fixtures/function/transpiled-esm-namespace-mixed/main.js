import * as external from 'external-esm-mixed';
import * as dep from './dep';

t.deepEqual(dep, {
  default: 'default',
  named: 'named'
});

t.deepEqual(external, {
  default: 'bar',
  foo: 'foo'
});
