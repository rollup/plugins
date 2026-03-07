import { exactRegex, prefixRegex, suffixRegex } from '../';

test('exactRegex supports without flag parameter', () => {
  expect(exactRegex('foo').toString()).toBe('/^foo$/');
});

test('exactRegex supports with multiple string and without flag parameter', () => {
  expect(exactRegex(['foo', 'bar']).toString()).toBe('/^(?:foo|bar)$/');
});

test('exactRegex supports with flag parameter', () => {
  expect(exactRegex('foo', 'i').toString()).toBe('/^foo$/i');
});

test('exactRegex supports with multiple string and flag parameter', () => {
  expect(exactRegex(['foo', 'bar'], 'i').toString()).toBe('/^(?:foo|bar)$/i');
});

test('exactRegex escapes special characters for Regex', () => {
  expect(exactRegex('foo(bar)').toString()).toBe('/^foo\\(bar\\)$/');
});

test('exactRegex escapes special characters with multiple string for Regex', () => {
  expect(exactRegex(['foo(bar)', 'baz(qux)']).toString()).toBe('/^(?:foo\\(bar\\)|baz\\(qux\\))$/');
});

test('prefixRegex supports without flag parameter', () => {
  expect(prefixRegex('foo').toString()).toBe('/^foo/');
});

test('prefixRegex supports with multiple string and without flag parameter', () => {
  expect(prefixRegex(['foo', 'bar']).toString()).toBe('/^(?:foo|bar)/');
});

test('prefixRegex supports with flag parameter', () => {
  expect(prefixRegex('foo', 'i').toString()).toBe('/^foo/i');
});

test('prefixRegex supports with multiple string and flag parameter', () => {
  expect(prefixRegex(['foo', 'bar'], 'i').toString()).toBe('/^(?:foo|bar)/i');
});

test('prefixRegex escapes special characters for Regex', () => {
  expect(prefixRegex('foo(bar)').toString()).toBe('/^foo\\(bar\\)/');
});

test('prefixRegex escapes special characters with multiple string for Regex', () => {
  expect(prefixRegex(['foo(bar)', 'baz(qux)']).toString()).toBe('/^(?:foo\\(bar\\)|baz\\(qux\\))/');
});

test('suffixRegex supports without flag parameter', () => {
  expect(suffixRegex('foo').toString()).toBe('/foo$/');
});

test('suffixRegex supports with multiple string and without flag parameter', () => {
  expect(suffixRegex(['foo', 'bar']).toString()).toBe('/(?:foo|bar)$/');
});

test('suffixRegex supports with flag parameter', () => {
  expect(suffixRegex('foo', 'i').toString()).toBe('/foo$/i');
});

test('suffixRegex supports with multiple string and flag parameter', () => {
  expect(suffixRegex(['foo', 'bar'], 'i').toString()).toBe('/(?:foo|bar)$/i');
});

test('suffixRegex escapes special characters for Regex', () => {
  expect(suffixRegex('foo(bar)').toString()).toBe('/foo\\(bar\\)$/');
});

test('suffixRegex escapes special characters with multiple string for Regex', () => {
  expect(suffixRegex(['foo(bar)', 'baz(qux)']).toString()).toBe('/(?:foo\\(bar\\)|baz\\(qux\\))$/');
});
