/* eslint-disable no-bitwise */

import { createRequire } from 'module';

import test from 'ava';
import { rollup } from 'rollup';

import multiEntry from 'current-package';

import { getCode } from '../../../util/test.js';

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

test('works as CJS plugin', async (t) => {
  const require = createRequire(import.meta.url);
  const multiEntryPluginCjs = require('current-package');
  const bundle = await rollup({ input: 'test/fixtures/0.js', plugins: [multiEntryPluginCjs()] });
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
});

test('maintains filename when preserveModules = true', async (t) => {
  const bundle = await rollup({
    input: 'test/fixtures/{0,1}.js',
    plugins: [multiEntry({ preserveModules: true, entryFileName: 'testing.js' })]
  });

  const files = await getCode(bundle, { format: 'cjs', preserveModules: true }, true);

  const nonVirtualFiles = files.filter(({ fileName }) => !fileName.includes('_virtual/'));

  t.is(nonVirtualFiles.length, 2);

  t.truthy(nonVirtualFiles.find(({ fileName }) => fileName === '0.js'));
  t.truthy(nonVirtualFiles.find(({ fileName }) => fileName === '1.js'));
});

test('makes a bundle with entryFileName as the output.entryFileName when preserveModules = true and entryName is not set', async (t) => {
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

  t.is(nonVirtualFiles.length, 2);

  t.truthy(nonVirtualFiles.find(({ fileName }) => fileName === 'entry-0.js'));
  t.truthy(nonVirtualFiles.find(({ fileName }) => fileName === 'entry-1.js'));
});

test('deterministic output, regardless of input order', async (t) => {
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

  t.is(code1, code2);
});

test('correctly extracts watch directories from glob patterns', async (t) => {
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

  t.deepEqual(watchedDirs, ['test/fixtures', 'src', './lib']);
});

test('does not watch directories when not in watch mode', async (t) => {
  const plugin = multiEntry();
  const options = plugin.options({ input: 'test/fixtures/*.js' });

  await plugin.buildStart.call(
    {
      meta: { watchMode: false },
      addWatchFile: () => {
        t.fail('Should not call addWatchFile when not in watch mode');
      }
    },
    options
  );

  t.pass('Should not attempt to watch files when not in watch mode');
});
