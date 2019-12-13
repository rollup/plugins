import { message, foo } from 'events';

t.is(message, 'this is not builtin');
t.is(foo, 'this is a hidden export');
