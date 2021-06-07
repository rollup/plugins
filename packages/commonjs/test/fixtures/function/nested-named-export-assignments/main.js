import dep from './dep1';
import { foo, bar } from './dep2';

t.is(dep.foo, 'second');
t.is(dep.bar, 'second');
t.is(foo, 'second');
t.is(bar, 'second');
