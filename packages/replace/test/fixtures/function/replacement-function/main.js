/* global t */
import foo from './dir/foo.js'; // eslint-disable-line

const bar = __filename;

// To work around windows issues
t.is(foo.slice(0, 3), 'dir');
t.is(foo.slice(-6), 'foo.js');
t.is(foo.length, 10);
t.is(bar, 'main.js');
