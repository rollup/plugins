import * as path from 'path';
import { createFilter } from '..';

describe('createFilter', function() {
	it('includes by default', function() {
		const filter = createFilter();
		expect(filter(path.resolve('x'))).toBeTruthy();
	});

	it('excludes IDs that are not included, if include.length > 0', function() {
		const filter = createFilter(['y']);
		expect(filter(path.resolve('x'))).toBeFalsy();
		expect(filter(path.resolve('y'))).toBeTruthy();
	});

	it('excludes IDs explicitly', function() {
		const filter = createFilter(null, ['y']);
		expect(filter(path.resolve('x'))).toBeTruthy();
		expect(filter(path.resolve('y'))).toBeFalsy();
	});

	it('handles non-array arguments', function() {
		const filter = createFilter('foo/*', 'foo/baz');
		expect(filter(path.resolve('foo/bar'))).toBeTruthy();
		expect(filter(path.resolve('foo/baz'))).toBeFalsy();
	});

	it('negation patterns', function() {
		const filter = createFilter(['a/!(b)/c']);
		expect(filter(path.resolve('a/d/c'))).toBeTruthy();
		expect(filter(path.resolve('a/b/c'))).toBeFalsy();
	});

	it('excludes non-string IDs', function() {
		const filter = createFilter(null, null);
		expect(filter({})).toBeFalsy();
	});

	it('excludes strings beginning with NUL', function() {
		const filter = createFilter(null, null);
		expect(filter('\0someid')).toBeFalsy();
	});

	it('includes with regexp', function() {
		const filter = createFilter(['a/!(b)/c', /\.js$/]);
		expect(filter(path.resolve('a/d/c'))).toBeTruthy();
		expect(filter(path.resolve('a/b/c'))).toBeFalsy();
		expect(filter(path.resolve('a.js'))).toBeTruthy();
		expect(filter(path.resolve('a/b.js'))).toBeTruthy();
		expect(filter(path.resolve('a/b.jsx'))).toBeFalsy();
	});

	it('excludes with regexp', function() {
		const filter = createFilter(['a/!(b)/c', /\.js$/], /\.js$/);
		expect(filter(path.resolve('a/d/c'))).toBeTruthy();
		expect(filter(path.resolve('a/b/c'))).toBeFalsy();
		expect(filter(path.resolve('a.js'))).toBeFalsy();
		expect(filter(path.resolve('a/b.js'))).toBeFalsy();
		expect(filter(path.resolve('a/b.jsx'))).toBeFalsy();
	});

	it('allows setting an absolute base dir', () => {
		const baseDir = path.resolve('C');
		const filter = createFilter(['y*'], ['yx'], { resolve: baseDir });
		expect(filter(baseDir + '/x')).toBeFalsy();
		expect(filter(baseDir + '/ys')).toBeTruthy();
		expect(filter(baseDir + '/yx')).toBeFalsy();
		expect(filter(path.resolve('C/d/ys'))).toBeFalsy();
		expect(filter(path.resolve('ys'))).toBeFalsy();
		expect(filter('ys')).toBeFalsy();
	});

	it('allows setting a relative base dir', () => {
		const filter = createFilter(['y*'], ['yx'], { resolve: 'C/d' });
		expect(filter(path.resolve('C/d/x'))).toBeFalsy();
		expect(filter(path.resolve('C/d/ys'))).toBeTruthy();
		expect(filter(path.resolve('C/d/yx'))).toBeFalsy();
		expect(filter(path.resolve('C') + '/ys')).toBeFalsy();
		expect(filter(path.resolve('ys'))).toBeFalsy();
		expect(filter('ys')).toBeFalsy();
	});

	it('ignores a falsy resolve value', () => {
		const filter = createFilter(['y*'], ['yx'], { resolve: null });
		expect(filter(path.resolve('x'))).toBeFalsy();
		expect(filter(path.resolve('ys'))).toBeTruthy();
		expect(filter(path.resolve('yx'))).toBeFalsy();
		expect(filter(path.resolve('C') + '/ys')).toBeFalsy();
		expect(filter(path.resolve('C/d/ys'))).toBeFalsy();
		expect(filter('ys')).toBeFalsy();
	});

	it('allows preventing resolution against process.cwd()', () => {
		const filter = createFilter(['y*'], ['yx'], { resolve: false });
		expect(filter('x')).toBeFalsy();
		expect(filter('ys')).toBeTruthy();
		expect(filter('yx')).toBeFalsy();
		expect(filter(path.resolve('C') + '/ys')).toBeFalsy();
		expect(filter(path.resolve('C/d/ys'))).toBeFalsy();
		expect(filter(path.resolve('ys'))).toBeFalsy();
	});

	it('includes names starting with a "."', () => {
		const filter = createFilter(['**/*a']);
		expect(filter(path.resolve('.a'))).toBeTruthy();
		expect(filter(path.resolve('.x/a'))).toBeTruthy();
	});
});
