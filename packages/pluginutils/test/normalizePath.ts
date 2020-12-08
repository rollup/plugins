import test from 'ava';

import { normalizePath } from '../src/index';

test('replaces \\ with /', (t) => {
  t.is(normalizePath('foo\\bar'), 'foo/bar');
  t.is(normalizePath('foo\\bar\\baz'), 'foo/bar/baz');
});

test('ignores forward slash', (t) => {
  t.is(normalizePath('foo/bar'), 'foo/bar');
  t.is(normalizePath('foo/bar\\baz'), 'foo/bar/baz');
});

test('handles empty string', (t) => {
  t.is(normalizePath(''), '');
});
