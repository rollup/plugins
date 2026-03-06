import { makeLegalIdentifier } from '../';

test('camel-cases names', () => {
  expect(makeLegalIdentifier('foo-bar')).toBe('fooBar');
});

test('replaces keywords', () => {
  expect(makeLegalIdentifier('typeof')).toBe('_typeof');
});

test('blacklists arguments (https://github.com/rollup/rollup/issues/871)', () => {
  expect(makeLegalIdentifier('arguments')).toBe('_arguments');
});

test('empty', () => {
  expect(makeLegalIdentifier('')).toBe('_');
});

test('handles input evaluated to blacklisted identifier', () => {
  expect(makeLegalIdentifier('parse-int')).toBe('_parseInt');
});
