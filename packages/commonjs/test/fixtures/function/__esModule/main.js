import * as x from './answer';

t.truthy('answer' in x);
t.truthy('default' in x);
t.truthy(!('__esModule' in x));
