import { addExtension } from '..';

describe('addExtension', function() {
	it('adds .js to an ID without an extension', function() {
		expect(addExtension('foo')).toEqual('foo.js');
	});

	it('ignores file with existing extension', function() {
		expect(addExtension('foo.js')).toEqual('foo.js');
		expect(addExtension('foo.json')).toEqual('foo.json');
	});

	it('ignores file with trailing dot', function() {
		expect(addExtension('foo.')).toEqual('foo.');
	});

	it('ignores leading .', function() {
		expect(addExtension('./foo')).toEqual('./foo.js');
		expect(addExtension('./foo.js')).toEqual('./foo.js');
	});

	it('adds a custom extension', function() {
		expect(addExtension('foo', '.wut')).toEqual('foo.wut');
		expect(addExtension('foo.lol', '.wut')).toEqual('foo.lol');
	});
});
