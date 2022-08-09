/* eslint-disable no-bitwise */

import test from 'ava';
import { rollup } from 'rollup';

import { getCode } from '../../../util/test';

import multiEntry from '../';

test('takes a single file as input', async (t) => {
  const bundle = await rollup({ input: 'test/fixtures/0.js', plugins: [multiEntry()] });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
});

test('takes an array of files as input', async (t) => {
  const bundle = await rollup({
    input: ['test/fixtures/0.js', 'test/fixtures/1.js'],
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.truthy(code.includes('exports.one = one;'));
});

test('allows an empty array as input', async (t) => {
  const bundle = await rollup({ input: [], plugins: [multiEntry()] });
  const code = await getCode(bundle);
  t.falsy(code.includes('exports'));
});

test('takes a glob as input', async (t) => {
  const bundle = await rollup({ input: 'test/fixtures/{0,1}.js', plugins: [multiEntry()] });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.truthy(code.includes('exports.one = one;'));
});

test('takes an array of globs as input', async (t) => {
  const bundle = await rollup({
    input: ['test/fixtures/{0,}.js', 'test/fixtures/{1,}.js'],
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.truthy(code.includes('exports.one = one;'));
});

test('takes an {include,exclude} object as input', async (t) => {
  const bundle = await rollup({
    input: {
      include: ['test/fixtures/*.js'],
      exclude: ['test/fixtures/1.js']
    },
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.falsy(code.includes('exports.one = one;'));
});

test('allows to prevent exporting', async (t) => {
  const bundle = await rollup({
    input: {
      include: ['test/fixtures/*.js'],
      exports: false
    },
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  t.truthy(code.includes(`console.log('Hello, 2');`));
  t.falsy(code.includes('zero'));
  t.falsy(code.includes('one'));
});

test('makes a bundle with entryFileName as the filename', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry({ entryFileName: 'testing.js' })]
  });
  const [result] = await getCode(bundle, { format: 'cjs' }, true);
  t.is(result.fileName, 'testing.js');
});

test('maintains filename when preserveModules = true', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry()]
  });
  const [result1, result2] = await getCode(bundle, { format: 'cjs', preserveModules: true }, true);
  t.is(result1.fileName, '0.js');
  t.is(result2.fileName, '1.js');
});
