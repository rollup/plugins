import { foo } from 'external-esm-named';

import { named } from './dep';

t.is(named, 'named');
t.is(foo, 'foo');
