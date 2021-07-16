import dep1 from './dep1.js';
import dep2 from './dep2.js';
import dep3 from './dep3.js';

t.is(dep1.foo, 'foo', 'dep1');
dep1.update();
t.is(dep1.foo, 'foo', 'dep1 updated');

t.is(dep2.foo, 'foo', 'dep2');
dep2.update();
t.is(dep2.foo, 'foo', 'dep2 updated');

t.is(dep3.foo, 'foo', 'dep3');
dep3.update();
t.is(dep3.foo, 'foo', 'dep3 updated');
