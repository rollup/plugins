import test from 'ava';

// eslint-disable-next-line
/// <reference types="../types/index.d.ts" />
import { plugins } from '@rollup/utils';

const { makeLegalIdentifier } = plugins;

test('camel-cases names', (t) => {
  t.is(makeLegalIdentifier('foo-bar'), 'fooBar');
});

test('replaces keywords', (t) => {
  t.is(makeLegalIdentifier('typeof'), '_typeof');
});

test('blacklists arguments (https://github.com/rollup/rollup/issues/871)', (t) => {
  t.is(makeLegalIdentifier('arguments'), '_arguments');
});

test('empty', (t) => {
  t.is(makeLegalIdentifier(''), '_');
});
