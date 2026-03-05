import { createRequire } from 'module';
import { fileURLToPath } from 'url';

import { test, expect } from 'vitest';
import { rollup } from 'rollup';

import dataUri from 'current-package';

import { testBundle } from '../../../util/test.js';

const DIRNAME = fileURLToPath(new URL('./fixtures', import.meta.url));
process.chdir(DIRNAME);

test('json', async () => {
  const bundle = await rollup({
    input: 'json.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(undefined, bundle);
  expect(code).toMatchSnapshot();
});

test('import', async () => {
  const bundle = await rollup({
    input: 'import.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(undefined, bundle);
  expect(code).toMatchSnapshot();
});

test('bad json', async () => {
  const fn = () =>
    rollup({
      input: 'bad-json.js',
      plugins: [dataUri()]
    });
  const error = await fn().then(() => null, (caught) => caught);
  expect(error).not.toBeNull();
  const { code, plugin, pluginCode } = error;
  expect({ code, plugin, pluginCode }).toMatchSnapshot();
});

test('base64', async () => {
  const bundle = await rollup({
    input: 'base64.js',
    plugins: [dataUri()]
  });
  const { code } = await testBundle(undefined, bundle);
  expect(code).toMatchSnapshot();
});

test('works as CJS plugin', async () => {
  const require = createRequire(import.meta.url);
  const dataUriCjs = require('current-package');
  const bundle = await rollup({
    input: 'json.js',
    plugins: [dataUriCjs()]
  });
  const { code } = await testBundle(undefined, bundle);
  expect(code).toMatchSnapshot();
});
