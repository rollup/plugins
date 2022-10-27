import { fileURLToPath } from 'url';

import test from 'ava';
import { rollup } from 'rollup';

import graphql from 'current-package';

import { testBundle } from '../../../util/test.js';

test.beforeEach(() => process.chdir(fileURLToPath(new URL('.', import.meta.url))));

test('works as an ES module', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/index.js',
    plugins: [graphql()]
  });

  const { module } = await testBundle(t, bundle);

  t.truthy('doc' in module.exports);
  t.is(module.exports.doc.kind, 'Document');
});
