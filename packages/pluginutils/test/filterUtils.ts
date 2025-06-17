import test from 'ava';

import { exactRegex, prefixRegex } from '../';

test('exactRegex supports without flag parameter', (t) => {
  t.is(exactRegex('foo').toString(), '/^foo$/');
});

test('exactRegex supports with flag parameter', (t) => {
  t.is(exactRegex('foo', 'i').toString(), '/^foo$/i');
});

test('exactRegex escapes special characters for Regex', (t) => {
  t.is(exactRegex('foo(bar)').toString(), '/^foo\\(bar\\)$/');
});

test('prefixRegex supports without flag parameter', (t) => {
  t.is(prefixRegex('foo').toString(), '/^foo/');
});

test('prefixRegex supports with flag parameter', (t) => {
  t.is(prefixRegex('foo', 'i').toString(), '/^foo/i');
});

test('prefixRegex escapes special characters for Regex', (t) => {
  t.is(prefixRegex('foo(bar)').toString(), '/^foo\\(bar\\)/');
});
