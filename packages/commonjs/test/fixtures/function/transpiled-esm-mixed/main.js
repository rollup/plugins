import external, { foo } from 'external-esm-mixed';
import dep, { named } from './dep';

t.is(dep, 'default');
t.is(named, 'named');
t.is(external, 'bar');
t.is(foo, 'foo');
