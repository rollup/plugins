/* eslint-disable consistent-return */

const test = require('ava');
const { rollup } = require('rollup');
const { SourceMapConsumer } = require('source-map');
const { getLocator } = require('locate-character');

const replace = require('../dist/rollup-plugin-replace.cjs.js');

const { getOutputFromGenerated } = require('./helpers/util');

function verifySourcemap(code, map, t) {
  return SourceMapConsumer.with(map, null, async (smc) => {
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
}

// Boilerplate shared configuration
const testPlugin = {
  resolveId: (id) => id,
  load: (importee) => {
    if (importee === 'main.js') {
      return 'import value from "other.js";\nlog(value);';
    }
    if (importee === 'other.js') {
      return 'export default ANSWER;';
    }
  }
};

test('generates sourcemaps by default', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [replace({ values: { ANSWER: '42' }, preventAssignment: true }), testPlugin]
  });

  const { code, map } = getOutputFromGenerated(
    await bundle.generate({ format: 'es', sourcemap: true })
  );

  await verifySourcemap(code, map, t);
});

test('generates sourcemaps if enabled in plugin', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({
        values: { ANSWER: '42' },
        sourcemap: true,
        preventAssignment: true
      }),
      testPlugin
    ]
  });

  const { code, map } = getOutputFromGenerated(
    await bundle.generate({ format: 'es', sourcemap: true })
  );

  await verifySourcemap(code, map, t);
});

test('generates sourcemaps if enabled in plugin (camelcase)', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({
        values: { ANSWER: '42' },
        sourceMap: true,
        preventAssignment: true
      }),
      testPlugin
    ]
  });

  const { code, map } = getOutputFromGenerated(
    await bundle.generate({ format: 'es', sourcemap: true })
  );

  await verifySourcemap(code, map, t);
});

test('does not generate sourcemaps if disabled in plugin', async (t) => {
  let warned = false;

  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      t.is(
        warning.message,
        "Sourcemap is likely to be incorrect: a plugin (replace) was used to transform files, but didn't generate a sourcemap for the transformation. Consult the plugin documentation for help"
      );
      warned = true;
    },
    plugins: [
      replace({
        values: { ANSWER: '42' },
        sourcemap: false,
        preventAssignment: true
      }),
      testPlugin
    ]
  });

  t.truthy(!warned);
  await bundle.generate({ format: 'es', sourcemap: true });
  t.truthy(warned);
});

test('does not generate sourcemaps if disabled in plugin (camelcase)', async (t) => {
  let warned = false;

  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      t.is(
        warning.message,
        "Sourcemap is likely to be incorrect: a plugin (replace) was used to transform files, but didn't generate a sourcemap for the transformation. Consult the plugin documentation for help"
      );
      warned = true;
    },
    plugins: [
      replace({
        values: { ANSWER: '42' },
        sourceMap: false,
        preventAssignment: true
      }),
      testPlugin
    ]
  });

  t.truthy(!warned);
  await bundle.generate({ format: 'es', sourcemap: true });
  t.truthy(warned);
});
