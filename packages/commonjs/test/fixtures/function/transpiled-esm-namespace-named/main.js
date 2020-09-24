import * as external from 'external-esm-named';

import * as dep from './dep';

t.deepEqual(dep, {
  named: 'named',
  // Technically, this should ideally not exist, or if we cannot avoid it due
  // to runtime default export detection, it should probably be undefined. We
  // return the namespace instead as this will fix
  // rollup/rollup-plugin-commonjs#224 until the remaining Rollup interop has
  // been updated
  default: { named: 'named' }
});

t.deepEqual(external, {
  foo: 'foo'
});
