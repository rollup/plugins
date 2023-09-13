/* eslint-disable no-prototype-builtins */

import array from './array.yaml';
import object from './object.yaml';

t.is(array.length, 2);
t.is(array[0].name, 'bob');
t.is(array[1].name, 'carl');

t.is(Object.keys(object).length, 2);
t.falsy(object.hasOwnProperty('alice'));
t.truthy(object.hasOwnProperty('bob'));
t.truthy(object.hasOwnProperty('carl'));
