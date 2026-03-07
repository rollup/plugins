import { addExtension } from '../';

test('adds .js to an ID without an extension', () => {
  expect(addExtension('foo')).toBe('foo.js');
});

test('ignores file with existing extension', () => {
  expect(addExtension('foo.js')).toBe('foo.js');
  expect(addExtension('foo.json')).toBe('foo.json');
});

test('ignores file with trailing dot', () => {
  expect(addExtension('foo.')).toBe('foo.');
});

test('ignores leading .', () => {
  expect(addExtension('./foo')).toBe('./foo.js');
  expect(addExtension('./foo.js')).toBe('./foo.js');
});

test('adds a custom extension', () => {
  expect(addExtension('foo', '.wut')).toBe('foo.wut');
  expect(addExtension('foo.lol', '.wut')).toBe('foo.lol');
});
