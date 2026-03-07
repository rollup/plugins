import { resolve as rawResolve } from 'path';

import { createFilter, normalizePath } from '../';

const resolve = (...parts: string[]) => normalizePath(rawResolve(...parts));

beforeEach(() => process.chdir(__dirname));

test('includes by default ', () => {
  const filter = createFilter();
  expect(filter(resolve('x'))).toBeTruthy();
});

test('excludes IDs that are not included, if include.length > 0', () => {
  const filter = createFilter(['y']);
  expect(filter(resolve('x'))).toBeFalsy();
  expect(filter(resolve('y'))).toBeTruthy();
});

test('excludes IDs explicitly', () => {
  const filter = createFilter(null, ['y']);
  expect(filter(resolve('x'))).toBeTruthy();
  expect(filter(resolve('y'))).toBeFalsy();
});

test('handles non-array arguments', () => {
  const filter = createFilter('foo/*', 'foo/baz');
  expect(filter(resolve('foo/bar'))).toBeTruthy();
  expect(filter(resolve('foo/baz'))).toBeFalsy();
});

test('negation patterns', () => {
  const filter = createFilter(['a/!(b)/c']);
  expect(filter(resolve('a/d/c'))).toBeTruthy();
  expect(filter(resolve('a/b/c'))).toBeFalsy();
});

test('excludes non-string IDs', () => {
  const filter = createFilter(null, null);
  expect(filter({})).toBeFalsy();
});

test('excludes strings beginning with NUL', () => {
  const filter = createFilter(null, null);
  expect(filter('\0someid')).toBeFalsy();
});

test('includes with regexp', () => {
  const filter = createFilter(['a/!(b)/c', /\.js$/]);
  expect(filter(resolve('a/d/c'))).toBeTruthy();
  expect(filter(resolve('a/b/c'))).toBeFalsy();
  expect(filter(resolve('a.js'))).toBeTruthy();
  expect(filter(resolve('a/b.js'))).toBeTruthy();
  expect(filter(resolve('a/b.jsx'))).toBeFalsy();
});

test('excludes with regexp', () => {
  const filter = createFilter(['a/!(b)/c', /\.js$/], /\.js$/);
  expect(filter(resolve('a/d/c'))).toBeTruthy();
  expect(filter(resolve('a/b/c'))).toBeFalsy();
  expect(filter(resolve('a.js'))).toBeFalsy();
  expect(filter(resolve('a/b.js'))).toBeFalsy();
  expect(filter(resolve('a/b.jsx'))).toBeFalsy();
});

test('allows setting an absolute base dir', () => {
  const baseDir = resolve('C');
  const filter = createFilter(['y*'], ['yx'], { resolve: baseDir });
  expect(filter(`${baseDir}/x`)).toBeFalsy();
  expect(filter(`${baseDir}/ys`)).toBeTruthy();
  expect(filter(`${baseDir}/yx`)).toBeFalsy();
  expect(filter(resolve('C/d/ys'))).toBeFalsy();
  expect(filter(resolve('ys'))).toBeFalsy();
  expect(filter('ys')).toBeFalsy();
});

test('allows setting a relative base dir', () => {
  const filter = createFilter(['y*'], ['yx'], { resolve: 'C/d' });
  expect(filter(resolve('C/d/x'))).toBeFalsy();
  expect(filter(resolve('C/d/ys'))).toBeTruthy();
  expect(filter(resolve('C/d/yx'))).toBeFalsy();
  expect(filter(`${resolve('C')}/ys`)).toBeFalsy();
  expect(filter(resolve('ys'))).toBeFalsy();
  expect(filter('ys')).toBeFalsy();
});

test('ignores a falsy resolve value', () => {
  const filter = createFilter(['y*'], ['yx'], { resolve: null });
  expect(filter(resolve('x'))).toBeFalsy();
  expect(filter(resolve('ys'))).toBeTruthy();
  expect(filter(resolve('yx'))).toBeFalsy();
  expect(filter(`${resolve('C')}/ys`)).toBeFalsy();
  expect(filter(resolve('C/d/ys'))).toBeFalsy();
  expect(filter('ys')).toBeFalsy();
});

test('allows preventing resolution against process.cwd()', () => {
  const filter = createFilter(['y*'], ['yx'], { resolve: false });
  expect(filter('x')).toBeFalsy();
  expect(filter('ys')).toBeTruthy();
  expect(filter('yx')).toBeFalsy();
  expect(filter(`${resolve('C')}/ys`)).toBeFalsy();
  expect(filter(resolve('C/d/ys'))).toBeFalsy();
  expect(filter(resolve('ys'))).toBeFalsy();
});

test('includes names starting with a "."', () => {
  const filter = createFilter(['**/*a']);
  expect(filter(resolve('.a'))).toBeTruthy();
  expect(filter(resolve('.x/a'))).toBeTruthy();
});

test.sequential('includes names containing parenthesis', () => {
  process.chdir(resolve(__dirname, 'fixtures/folder-with (parens)'));
  const filter = createFilter(['*.ts+(|x)', '**/*.ts+(|x)'], ['*.d.ts', '**/*.d.ts']);
  expect(filter(resolve('folder (test)/src/main.tsx'))).toBeTruthy();
  expect(filter(resolve('.x/(test)a.ts'))).toBeTruthy();
  expect(filter(resolve('.x/(test)a.d.ts'))).toBeFalsy();
});

test('handles relative paths', () => {
  const filter = createFilter(['./index.js', './foo/../a.js']);
  expect(filter(resolve('index.js'))).toBeTruthy();
  expect(filter(resolve('a.js'))).toBeTruthy();
  expect(filter(resolve('foo/a.js'))).toBeFalsy();
});

test('does not add current working directory when pattern is an absolute path', () => {
  const filter = createFilter([resolve('..', '..', '*')]);
  expect(filter(resolve('..', '..', 'a'))).toBeTruthy();
  expect(filter(resolve('..', '..', 'b'))).toBeTruthy();
  expect(filter(resolve('..', 'c'))).toBeFalsy();
});

test('does not add current working directory when pattern starts with character **', () => {
  const filter = createFilter(['**/*']);

  expect(filter(resolve('a'))).toBeTruthy();
  expect(filter(resolve('..', '..', 'a'))).toBeTruthy();
});

test('add current working directory when pattern starts with one *', () => {
  const filter = createFilter([`*`]);

  expect(filter(resolve('a'))).toBeTruthy();
  expect(filter(resolve('..', '..', 'a'))).toBeFalsy();
});

test('normalizes path when pattern is an absolute path', () => {
  const filterPosix = createFilter([`${resolve('.')}/*`]);
  const filterWin = createFilter([`${resolve('.')}\\*`]);

  expect(filterPosix(resolve('a'))).toBeTruthy();
  expect(filterWin(resolve('a'))).toBeTruthy();
});

test('normalizes path when pattern starts with *', () => {
  const filterPosix = createFilter([`**/a`]);
  const filterWin = createFilter([`**\\a`]);

  expect(filterPosix(resolve('a'))).toBeTruthy();
  expect(filterWin(resolve('a'))).toBeTruthy();
});

test('normalizes path when pattern has resolution base', () => {
  const filterPosix = createFilter([`test/*`], [], {
    resolve: __dirname
  });
  const filterWin = createFilter([`test\\*`], [], {
    resolve: __dirname
  });

  expect(filterPosix(resolve('test/a'))).toBeTruthy();
  expect(filterWin(resolve('test/a'))).toBeTruthy();
});

test('pass a regular expression to the include parameter', () => {
  const filter = createFilter([/zxcvbnmasdfg/]);
  expect(filter(resolve('zxcvbnmasdfg'))).toBeTruthy();
  expect(filter(resolve('zxcvbnmasdfe'))).toBeFalsy();
});

test('pass a regular expression to the include parameter with g flag', () => {
  const filter = createFilter([/zxcvbnmasdfg/g]);
  expect(filter(resolve('zxcvbnmasdfg'))).toBeTruthy();
  expect(filter(resolve('zxcvbnmasdfg'))).toBeTruthy();
});

test('pass a regular expression to the exclude parameter', () => {
  const filter = createFilter(null, [/zxcvbnmasdfg/]);
  expect(filter(resolve('zxcvbnmasdfg'))).toBeFalsy();
  expect(filter(resolve('zxcvbnmasdfe'))).toBeTruthy();
});

test('pass a regular expression to the exclude parameter with g flag', () => {
  const filter = createFilter(null, [/zxcvbnmasdfg/g]);
  expect(filter(resolve('zxcvbnmasdfg'))).toBeFalsy();
  expect(filter(resolve('zxcvbnmasdfg'))).toBeFalsy();
});
