import { fileURLToPath } from 'url';

import { beforeEach, test, expect } from 'vitest';
import { rollup } from 'rollup';

import graphql from 'current-package';

import { testBundle } from '../../../util/test.js';

beforeEach(() => process.chdir(fileURLToPath(new URL('.', import.meta.url))));

test('works as an ES module', async () => {
  const bundle = await rollup({
    input: 'fixtures/basic/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(undefined, bundle);

  expect('doc' in module.exports).toBeTruthy();
  expect(module.exports.doc.kind).toBe('Document');
});
