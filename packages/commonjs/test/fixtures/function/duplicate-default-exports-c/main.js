/* eslint-disable */
import E from './exports.js';
import { Foo } from './exports.js';
import { var as Var } from './exports.js';

t.is(E.Foo, 1);
t.is(E.var, 'VAR');
t.deepEqual(E.default, { Foo: 2, default: 3 });
t.is(E.default.Foo, 2);
t.is(E.default.default, 3);
t.is(Foo, 1);
t.is(Var, 'VAR');
