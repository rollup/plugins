import { join } from 'path';

import test from 'ava';
import { rollup } from 'rollup';

import { testBundle } from '../../../util/test';

import dataUri from '..';

process.chdir(join(__dirname, 'fixtures'));

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
