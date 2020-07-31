import external from 'external-esm-default';

import dep from './dep';

t.is(dep, 'default');
t.is(external, 'bar');
