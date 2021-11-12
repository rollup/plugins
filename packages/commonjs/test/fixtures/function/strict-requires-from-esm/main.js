import { foo } from './strict.js';
import './dep.js';

t.is(foo, 'foo');
