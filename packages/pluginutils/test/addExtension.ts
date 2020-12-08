import test from 'ava';

import { addExtension } from '../src/index';

test('adds .js to an ID without an extension', (t) => {
  t.is(addExtension('foo'), 'foo.js');
});

test('ignores file with existing extension', (t) => {
  t.is(addExtension('foo.js'), 'foo.js');
  t.is(addExtension('foo.json'), 'foo.json');
});

test('ignores file with trailing dot', (t) => {
  t.is(addExtension('foo.'), 'foo.');
});

test('ignores leading .', (t) => {
  t.is(addExtension('./foo'), './foo.js');
  t.is(addExtension('./foo.js'), './foo.js');
});

test('adds a custom extension', (t) => {
  t.is(addExtension('foo', '.wut'), 'foo.wut');
  t.is(addExtension('foo.lol', '.wut'), 'foo.lol');
});
