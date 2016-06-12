const assert = require('assert');
const { rollup } = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const eslint = require('../');

process.chdir('test');

describe('rollup-plugin-eslint', () => {
	it('should lint files', () => {
		let count = 0;
		return rollup({
			entry: 'fixtures/undeclared.js',
			plugins: [
				eslint({
					formatter: (results) => {
						count += results[0].messages.length;
						const message = results[0].messages[0].message;
						assert.equal(message, '\'x\' is not defined.');
					}
				})
			]
		}).then(() => {
			assert.equal(count, 1);
		});
	});

	it('should ignore node_modules with exclude option', () => {
		return rollup({
			entry: 'fixtures/modules.js',
			external: ['path', 'minimatch', 'estree-walker'],
			plugins: [
				nodeResolve({ jsnext: true }),
				eslint({
					configFile: 'fixtures/.eslintrc-babel',
					exclude: '../node_modules/**',
					formatter: () => {
						assert.fail('should not report any error');
					}
				})
			]
		});
	});

	it('should ignore files according .eslintignore', () => {
		return rollup({
			entry: 'fixtures/ignored.js',
			plugins: [
				eslint({
					formatter: () => {
						assert.fail('should not report any error');
					}
				})
			]
		});
	});

	it('should fail with enabled throwError option', () => {
		return rollup({
			entry: 'fixtures/use-strict.js',
			plugins: [
				eslint({
					throwError: true,
					formatter: () => ''
				})
			]
		}).then(() => {
			assert.fail('should throw error');
		}).catch(err => {
			assert.notEqual(err.toString().indexOf('Warnings or errors were found'), -1);
		});
	});
});
