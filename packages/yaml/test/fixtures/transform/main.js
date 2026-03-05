/* eslint-disable no-prototype-builtins */

import array from './array.yaml';
import object from './object.yaml';

expect(array.length).toBe(2);
expect(array[0].name).toBe('bob');
expect(array[1].name).toBe('carl');

expect(Object.keys(object).length).toBe(2);
expect(object.hasOwnProperty('alice')).toBeFalsy();
expect(object.hasOwnProperty('bob')).toBeTruthy();
expect(object.hasOwnProperty('carl')).toBeTruthy();
