import { createRequire } from 'module';
import { fileURLToPath } from 'url';

import test from 'ava';
import { rollup } from 'rollup';

import dataUri from 'current-package';

import { testBundle } from '../../../util/test.js';

const DIRNAME = fileURLToPath(new URL('./fixtures', import.meta.url));
process.chdir(DIRNAME);

test('json', async (t) => {
  t.plan(3);
  const bundle = await rollup({
    input: 'json.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(t, bundle);
  t.snapshot(code);
});

test('import', async (t) => {
  t.plan(3);
  const bundle = await rollup({
    input: 'import.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(t, bundle);
  t.snapshot(code);
});

test('bad json', async (t) => {
  const fn = () =>
    rollup({
      input: 'bad-json.js',
      plugins: [dataUri()]
    });
  const { code, plugin, pluginCode } = await t.throwsAsync(fn);
  t.snapshot({ code, plugin, pluginCode });
});

test('base64', async (t) => {
  t.plan(3);
  const bundle = await rollup({
    input: 'base64.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(t, bundle);
  t.snapshot(code);
});

test('works as CJS plugin', async (t) => {
  t.plan(3);
  const require = createRequire(import.meta.url);
  const dataUriCjs = require('current-package');
  const bundle = await rollup({
    input: 'json.js',
    plugins: [dataUriCjs()]
  });
  const { code } = await testBundle(t, bundle);
  t.snapshot(code);
});
