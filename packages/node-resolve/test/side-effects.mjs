import { join } from 'path';
import { fileURLToPath } from 'url';

import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';

import { nodeResolve } from 'current-package';

import { getCode, testBundle } from '../../../util/test.js';

import { createAvaAssertions } from './helpers/ava-assertions.js';

const t = createAvaAssertions();

const DIRNAME = fileURLToPath(new URL('.', import.meta.url));
process.chdir(join(DIRNAME, 'fixtures'));

const failOnWarn = (warning) =>
  t.fail(`No warnings were expected, got:\n${warning.code}\n${warning.message}`);

test('respects the package.json sideEffects property for files in root package by default', async () => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        rootDir: 'root-package-side-effect'
      })
    ]
  });

  const code = await getCode(bundle);
  t.false(code.includes('side effect'));
  t.snapshot(code);
});

test('respects the package.json sideEffects when commonjs plugin is used', async () => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    onwarn: failOnWarn,
    plugins: [
      commonjs(),
      nodeResolve({
        rootDir: 'root-package-side-effect'
      })
    ]
  });

  const code = await getCode(bundle);
  t.false(code.includes('side effect'));
  t.snapshot(code);
});

test('respects the package.json sideEffects when when another plugin uses this.load it its resolveId hook', async () => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    onwarn: failOnWarn,
    plugins: [
      {
        name: 'test',
        async resolveId(source, importer, resolveOptions) {
          const resolved = await this.resolve(source, importer, {
            ...resolveOptions,
            skipSelf: true
          });
          // This starts loading the module and fixes the value of
          // `moduleSideEffects` with whatever is contained in "resolved"
          await this.load(resolved);
          return resolved;
        }
      },
      nodeResolve({
        rootDir: 'root-package-side-effect'
      })
    ]
  });

  const code = await getCode(bundle);
  t.false(code.includes('side effect'));
  t.snapshot(code);
});

test('respects the package.json sideEffects property for files in the root package and supports deep side effects', async () => {
  const bundle = await rollup({
    input: 'deep-side-effects/index.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        rootDir: 'deep-side-effects'
      })
    ]
  });
  const code = await getCode(bundle);
  t.true(code.includes('shallow side effect'));
  t.true(code.includes('deep side effect'));
  t.snapshot(code);
});

test('does not prefix the sideEffects property if the side effect contains a "/"', async () => {
  const bundle = await rollup({
    input: 'deep-side-effects-with-specific-side-effects/index.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        rootDir: 'deep-side-effects-with-specific-side-effects'
      })
    ]
  });
  const code = await getCode(bundle);
  t.true(code.includes('shallow side effect'));
  t.false(code.includes('deep side effects'));
  t.snapshot(code);
});

test('ignores the package.json sideEffects property for files in root package with "ignoreSideEffectsForRoot" option', async () => {
  const bundle = await rollup({
    input: 'root-package-side-effect/index.js',
    onwarn: failOnWarn,
    plugins: [
      nodeResolve({
        rootDir: 'root-package-side-effect',
        ignoreSideEffectsForRoot: true
      })
    ]
  });

  const code = await getCode(bundle);
  t.true(code.includes('side effect'));
  t.snapshot(code);
});

test('handles package side-effects', async () => {
  const bundle = await rollup({
    input: 'side-effects.js',
    onwarn: failOnWarn,
    plugins: [nodeResolve()]
  });
  await testBundle(t, bundle);
  t.snapshot(global.sideEffects);

  delete global.sideEffects;
});
