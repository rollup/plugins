import { normalizePath } from '../';

test('replaces \\ with /', () => {
  expect(normalizePath('foo\\bar')).toBe('foo/bar');
  expect(normalizePath('foo\\bar\\baz')).toBe('foo/bar/baz');
});

test('ignores forward slash', () => {
  expect(normalizePath('foo/bar')).toBe('foo/bar');
  expect(normalizePath('foo/bar\\baz')).toBe('foo/bar/baz');
});

test('handles empty string', () => {
  expect(normalizePath('')).toBe('');
});
