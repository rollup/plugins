import { resolve } from 'path';

import test from 'ava';

import { createFilter } from '..';

test('includes by default', (t) => {
  const filter = createFilter();
  t.truthy(filter(resolve('x')));
});

test('excludes IDs that are not included, if include.length > 0', (t) => {
  const filter = createFilter(['y']);
  t.falsy(filter(resolve('x')));
  t.truthy(filter(resolve('y')));
});

test('excludes IDs explicitly', (t) => {
  const filter = createFilter(null, ['y']);
  t.truthy(filter(resolve('x')));
  t.falsy(filter(resolve('y')));
});

test('handles non-array arguments', (t) => {
  const filter = createFilter('foo/*', 'foo/baz');
  t.truthy(filter(resolve('foo/bar')));
  t.falsy(filter(resolve('foo/baz')));
});

test('negation patterns', (t) => {
  const filter = createFilter(['a/!(b)/c']);
  t.truthy(filter(resolve('a/d/c')));
  t.falsy(filter(resolve('a/b/c')));
});

test('excludes non-string IDs', (t) => {
  const filter = createFilter(null, null);
  t.falsy(filter({}));
});

test('excludes strings beginning with NUL', (t) => {
  const filter = createFilter(null, null);
  t.falsy(filter('\0someid'));
});

test('includes with regexp', (t) => {
  const filter = createFilter(['a/!(b)/c', /\.js$/]);
  t.truthy(filter(resolve('a/d/c')));
  t.falsy(filter(resolve('a/b/c')));
  t.truthy(filter(resolve('a.js')));
  t.truthy(filter(resolve('a/b.js')));
  t.falsy(filter(resolve('a/b.jsx')));
});

test('excludes with regexp', (t) => {
  const filter = createFilter(['a/!(b)/c', /\.js$/], /\.js$/);
  t.truthy(filter(resolve('a/d/c')));
  t.falsy(filter(resolve('a/b/c')));
  t.falsy(filter(resolve('a.js')));
  t.falsy(filter(resolve('a/b.js')));
  t.falsy(filter(resolve('a/b.jsx')));
});

test('allows setting an absolute base dir', (t) => {
  const baseDir = resolve('C');
  const filter = createFilter(['y*'], ['yx'], { resolve: baseDir });
  t.falsy(filter(`${baseDir}/x`));
  t.truthy(filter(`${baseDir}/ys`));
  t.falsy(filter(`${baseDir}/yx`));
  t.falsy(filter(resolve('C/d/ys')));
  t.falsy(filter(resolve('ys')));
  t.falsy(filter('ys'));
});

test('allows setting a relative base dir', (t) => {
  const filter = createFilter(['y*'], ['yx'], { resolve: 'C/d' });
  t.falsy(filter(resolve('C/d/x')));
  t.truthy(filter(resolve('C/d/ys')));
  t.falsy(filter(resolve('C/d/yx')));
  t.falsy(filter(`${resolve('C')}/ys`));
  t.falsy(filter(resolve('ys')));
  t.falsy(filter('ys'));
});

test('ignores a falsy resolve value', (t) => {
  const filter = createFilter(['y*'], ['yx'], { resolve: null });
  t.falsy(filter(resolve('x')));
  t.truthy(filter(resolve('ys')));
  t.falsy(filter(resolve('yx')));
  t.falsy(filter(`${resolve('C')}/ys`));
  t.falsy(filter(resolve('C/d/ys')));
  t.falsy(filter('ys'));
});

test('allows preventing resolution against process.cwd()', (t) => {
  const filter = createFilter(['y*'], ['yx'], { resolve: false });
  t.falsy(filter('x'));
  t.truthy(filter('ys'));
  t.falsy(filter('yx'));
  t.falsy(filter(`${resolve('C')}/ys`));
  t.falsy(filter(resolve('C/d/ys')));
  t.falsy(filter(resolve('ys')));
});

test('includes names starting with a "."', (t) => {
  const filter = createFilter(['**/*a']);
  t.truthy(filter(resolve('.a')));
  t.truthy(filter(resolve('.x/a')));
});
