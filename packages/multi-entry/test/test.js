/* eslint-disable no-bitwise */

import fs from 'fs';
import path from 'path';

import test from 'ava';
import { rollup } from 'rollup';

import { getCode } from '../../../util/test';

import multiEntry from '../';

const testDistDir = path.join(__dirname, 'dist');
const outputOptions = { format: 'cjs', output: { dir: testDistDir } };

let outFile;
if (process.platform === 'win32') {
  // the colon is different
  outFile = '_rollup꞉plugin-multi-entry꞉entry-point.js';
} else {
  outFile = '_rollup:plugin-multi-entry:entry-point.js';
}
const outputPath = path.join(testDistDir, outFile);

test('takes a single file as input', async (t) => {
  const bundle = await rollup({ input: 'test/fixtures/0.js', plugins: [multiEntry()] });
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
});

test('takes an array of files as input', async (t) => {
  const bundle = await rollup({
    input: ['test/fixtures/0.js', 'test/fixtures/1.js'],
    plugins: [multiEntry()]
  });
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.truthy(code.includes('exports.one = one;'));
});

test('allows an empty array as input', async (t) => {
  const bundle = await rollup({ input: [], plugins: [multiEntry()] });
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
  const code = await getCode(bundle);
  t.falsy(code.includes('exports'));
});

test('takes a glob as input', async (t) => {
  const bundle = await rollup({ input: 'test/fixtures/{0,1}.js', plugins: [multiEntry()] });
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
  const code = await getCode(bundle);
  t.truthy(code.includes('exports.zero = zero;'));
  t.truthy(code.includes('exports.one = one;'));
});

test('takes an array of globs as input', async (t) => {
  const bundle = await rollup({
    input: ['test/fixtures/{0,}.js', 'test/fixtures/{1,}.js'],
    plugins: [multiEntry()]
  });
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
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
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
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
  t.truthy(await isBundleWritten(bundle, outputOptions, outputPath, testDistDir));
  const code = await getCode(bundle);
  t.truthy(code.includes(`console.log('Hello, 2');`));
  t.falsy(code.includes('zero'));
  t.falsy(code.includes('one'));
});

async function isBundleWritten(bundle, outputOptions, outputPath) {
  await bundle.write(outputOptions);
  const iswritten = fs.existsSync(outputPath);
  fs.rmdirSync(testDistDir, { recursive: true });
  return iswritten;
}
