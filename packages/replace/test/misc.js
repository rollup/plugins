/* eslint-disable consistent-return, global-require, import/no-dynamic-require */

const test = require('ava');
const { rollup } = require('rollup');
const { SourceMapConsumer } = require('source-map');
const { getLocator } = require('locate-character');

const replace = require('../dist/rollup-plugin-replace.cjs.js');

const { getOutputFromGenerated } = require('./helpers/util');

test('does not mutate the values map properties', async (t) => {
  const valuesMap = { ANSWER: '42' };
  const bundle = await rollup({
    input: 'main.js',
    plugins: [
      replace({ values: valuesMap }),
      {
        resolveId(id) {
          return id;
        },
        load(importee) {
          if (importee === 'main.js') {
            return 'log(ANSWER);';
          }
        }
      }
    ]
  });

  const { code } = getOutputFromGenerated(await bundle.generate({ format: 'es' }));
  t.is(code.trim(), 'log(42);');
  t.deepEqual(valuesMap, { ANSWER: '42' });
});

test('generates sourcemaps', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({ values: { ANSWER: '42' } }),
      {
        resolveId(id) {
          return id;
        },
        load(importee) {
          if (importee === 'main.js') {
            return 'import value from "other.js";\nlog(value);';
          }
          if (importee === 'other.js') {
            return 'export default ANSWER;';
          }
        }
      }
    ]
  });

  const { code, map } = getOutputFromGenerated(
    await bundle.generate({ format: 'es', sourcemap: true })
  );

  await SourceMapConsumer.with(map, null, async (smc) => {
    const locator = getLocator(code, { offsetLine: 1 });

    let generatedLoc = locator('42');
    let loc = smc.originalPositionFor(generatedLoc);
    t.snapshot(generatedLoc);
    t.snapshot(loc);

    generatedLoc = locator('log');
    loc = smc.originalPositionFor(generatedLoc);
    t.snapshot(generatedLoc);
    t.snapshot(loc);
  });
});

test('does not generate sourcemaps if disabled', async (t) => {
  let warned = false;

  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      t.is(
        warning.message,
        "Sourcemap is likely to be incorrect: a plugin ('replace') was used to transform files, but didn't generate a sourcemap for the transformation. Consult the plugin documentation for help"
      );
      warned = true;
    },
    plugins: [
      replace({ values: { ANSWER: '42' }, sourcemap: false }),
      {
        resolveId(id) {
          return id;
        },

        load(importee) {
          if (importee === 'main.js') {
            return 'import value from "other.js";\nlog(value);';
          }
          if (importee === 'other.js') {
            return 'export default ANSWER;';
          }
        }
      }
    ]
  });

  t.truthy(!warned);
  await bundle.generate({ format: 'es', sourcemap: true });
  t.truthy(warned);
});
