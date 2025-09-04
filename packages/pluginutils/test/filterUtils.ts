import test from 'ava';

import { exactRegex, prefixRegex, suffixRegex } from '../';

test('exactRegex supports without flag parameter', (t) => {
  t.is(exactRegex('foo').toString(), '/^foo$/');
});

test('exactRegex supports with multiple string and without flag parameter', (t) => {
  t.is(exactRegex(['foo', 'bar']).toString(), '/^(?:foo|bar)$/');
});

test('exactRegex supports with flag parameter', (t) => {
  t.is(exactRegex('foo', 'i').toString(), '/^foo$/i');
});

test('exactRegex supports with multiple string and flag parameter', (t) => {
  t.is(exactRegex(['foo', 'bar'], 'i').toString(), '/^(?:foo|bar)$/i');
});

test('exactRegex escapes special characters for Regex', (t) => {
  t.is(exactRegex('foo(bar)').toString(), '/^foo\\(bar\\)$/');
});

test('exactRegex escapes special characters with multiple string for Regex', (t) => {
  t.is(exactRegex(['foo(bar)', 'baz(qux)']).toString(), '/^(?:foo\\(bar\\)|baz\\(qux\\))$/');
});

test('prefixRegex supports without flag parameter', (t) => {
  t.is(prefixRegex('foo').toString(), '/^foo/');
});

test('prefixRegex supports with multiple string and without flag parameter', (t) => {
  t.is(prefixRegex(['foo', 'bar']).toString(), '/^(?:foo|bar)/');
});

test('prefixRegex supports with flag parameter', (t) => {
  t.is(prefixRegex('foo', 'i').toString(), '/^foo/i');
});

test('prefixRegex supports with multiple string and flag parameter', (t) => {
  t.is(prefixRegex(['foo', 'bar'], 'i').toString(), '/^(?:foo|bar)/i');
});

test('prefixRegex escapes special characters for Regex', (t) => {
  t.is(prefixRegex('foo(bar)').toString(), '/^foo\\(bar\\)/');
});

test('prefixRegex escapes special characters with multiple string for Regex', (t) => {
  t.is(prefixRegex(['foo(bar)', 'baz(qux)']).toString(), '/^(?:foo\\(bar\\)|baz\\(qux\\))/');
});

test('suffixRegex supports without flag parameter', (t) => {
  t.is(suffixRegex('foo').toString(), '/foo$/');
});

test('suffixRegex supports with multiple string and without flag parameter', (t) => {
  t.is(suffixRegex(['foo', 'bar']).toString(), '/(?:foo|bar)$/');
});

test('suffixRegex supports with flag parameter', (t) => {
  t.is(suffixRegex('foo', 'i').toString(), '/foo$/i');
});

test('suffixRegex supports with multiple string and flag parameter', (t) => {
  t.is(suffixRegex(['foo', 'bar'], 'i').toString(), '/(?:foo|bar)$/i');
});

test('suffixRegex escapes special characters for Regex', (t) => {
  t.is(suffixRegex('foo(bar)').toString(), '/foo\\(bar\\)$/');
});

test('suffixRegex escapes special characters with multiple string for Regex', (t) => {
  t.is(suffixRegex(['foo(bar)', 'baz(qux)']).toString(), '/(?:foo\\(bar\\)|baz\\(qux\\))$/');
});
