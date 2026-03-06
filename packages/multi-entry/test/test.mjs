/* eslint-disable no-bitwise */

import { createRequire } from 'module';

import { test, expect } from 'vitest';
import { rollup } from 'rollup';

import multiEntry from 'current-package';

import { getCode } from '../../../util/test.js';

test('takes a single file as input', async () => {
  const bundle = await rollup({ input: 'test/fixtures/0.js', plugins: [multiEntry()] });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
});

test('takes an array of files as input', async () => {
  const bundle = await rollup({
    input: ['test/fixtures/0.js', 'test/fixtures/1.js'],
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
  expect(code.includes('exports.one = one;')).toBeTruthy();
});

test('allows an empty array as input', async () => {
  const bundle = await rollup({ input: [], plugins: [multiEntry()] });
  const code = await getCode(bundle);
  expect(code.includes('exports')).toBeFalsy();
});

test('takes a glob as input', async () => {
  const bundle = await rollup({ input: 'test/fixtures/{0,1}.js', plugins: [multiEntry()] });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
  expect(code.includes('exports.one = one;')).toBeTruthy();
});

test('takes an array of globs as input', async () => {
  const bundle = await rollup({
    input: ['test/fixtures/{0,}.js', 'test/fixtures/{1,}.js'],
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
  expect(code.includes('exports.one = one;')).toBeTruthy();
});

test('takes an {include,exclude} object as input', async () => {
  const bundle = await rollup({
    input: {
      include: ['test/fixtures/*.js'],
      exclude: ['test/fixtures/1.js']
    },
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
  expect(code.includes('exports.one = one;')).toBeFalsy();
});

test('allows to prevent exporting', async () => {
  const bundle = await rollup({
    input: {
      include: ['test/fixtures/*.js'],
      exports: false
    },
    plugins: [multiEntry()]
  });
  const code = await getCode(bundle);
  expect(code.includes(`console.log('Hello, 2');`)).toBeTruthy();
  expect(code.includes('zero')).toBeFalsy();
  expect(code.includes('one')).toBeFalsy();
});

test('makes a bundle with entryFileName as the filename', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry({ entryFileName: 'testing.js' })]
  });
  const [result] = await getCode(bundle, { format: 'cjs' }, true);
  expect(result.fileName).toBe('testing.js');
});

test('works as CJS plugin', async () => {
  const require = createRequire(import.meta.url);
  const multiEntryPluginCjs = require('current-package');
  const bundle = await rollup({ input: 'test/fixtures/0.js', plugins: [multiEntryPluginCjs()] });
  const code = await getCode(bundle);
  expect(code.includes('exports.zero = zero;')).toBeTruthy();
});

test('maintains filename when preserveModules = true', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry({ preserveModules: true, entryFileName: 'testing.js' })]
  });

  const files = await getCode(bundle, { format: 'cjs', preserveModules: true }, true);

  const nonVirtualFiles = files.filter(({ fileName }) => !fileName.includes('_virtual/'));

  expect(nonVirtualFiles.length).toBe(2);

  expect(nonVirtualFiles.find(({ fileName }) => fileName === '0.js')).toBeTruthy();
  expect(nonVirtualFiles.find(({ fileName }) => fileName === '1.js')).toBeTruthy();
});

test('makes a bundle with entryFileName as the output.entryFileName when preserveModules = true and entryName is not set', async () => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry({ preserveModules: true })]
  });

  const files = await getCode(
    bundle,
    {
      format: 'cjs',
      preserveModules: true,
      entryFileNames: (c) => `entry-${c.name}.js`
    },
    true
  );

  const nonVirtualFiles = files.filter(({ fileName }) => !fileName.includes('_virtual/'));

  expect(nonVirtualFiles.length).toBe(2);

  expect(nonVirtualFiles.find(({ fileName }) => fileName === 'entry-0.js')).toBeTruthy();
  expect(nonVirtualFiles.find(({ fileName }) => fileName === 'entry-1.js')).toBeTruthy();
});

test('deterministic output, regardless of input order', async () => {
  const bundle1 = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry()]
  });
  const code1 = await getCode(bundle1);

  const bundle2 = await rollup({
    input: 'test/fixtures/{1,0}.js',
    plugins: [multiEntry()]
  });
  const code2 = await getCode(bundle2);

  expect(code1).toBe(code2);
});

test('correctly extracts watch directories from glob patterns', async () => {
  const plugin = multiEntry();
  const options = plugin.options({
    input: ['test/fixtures/*.js', 'src/**/*.js', './lib/{util,helper}.js']
  });

  const watchedDirs = [];
  await plugin.buildStart.call(
    {
      meta: { watchMode: true },
      addWatchFile: (dir) => {
        watchedDirs.push(dir);
      }
    },
    options
  );

  expect(watchedDirs).toEqual(['test/fixtures', 'src', './lib']);
});

test('does not watch directories when not in watch mode', async () => {
  const plugin = multiEntry();
  const options = plugin.options({ input: 'test/fixtures/*.js' });

  await plugin.buildStart.call(
    {
      meta: { watchMode: false },
      addWatchFile: () => {
        throw new Error('Should not call addWatchFile when not in watch mode');
      }
    },
    options
  );
});
