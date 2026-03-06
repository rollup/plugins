/* eslint-disable consistent-return */

const { rollup } = require('rollup');
const { getLocator } = require('locate-character');
// source-map uses the presence of fetch to detect browser environments which
// breaks in Node 18
const { fetch } = global;
delete global.fetch;
const { SourceMapConsumer } = require('source-map');

global.fetch = fetch;
const replace = require('..');

const { getOutputFromGenerated } = require('./helpers/util');

function verifySourcemap(code, map) {
  return SourceMapConsumer.with(map, null, async (smc) => {
    const locator = getLocator(code, {
      offsetLine: 1
    });
    let generatedLoc = locator('42');
    let loc = smc.originalPositionFor(generatedLoc);
    expect(generatedLoc).toMatchSnapshot();
    expect(loc).toMatchSnapshot();
    generatedLoc = locator('log');
    loc = smc.originalPositionFor(generatedLoc);
    expect(generatedLoc).toMatchSnapshot();
    expect(loc).toMatchSnapshot();
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
test('generates sourcemaps by default', async () => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({
        values: {
          ANSWER: '42'
        },
        preventAssignment: true
      }),
      testPlugin
    ]
  });
  const { code, map } = getOutputFromGenerated(
    await bundle.generate({
      format: 'es',
      sourcemap: true
    })
  );
  await verifySourcemap(code, map);
});
test('generates sourcemaps if enabled in plugin', async () => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({
        values: {
          ANSWER: '42'
        },
        sourcemap: true,
        preventAssignment: true
      }),
      testPlugin
    ]
  });
  const { code, map } = getOutputFromGenerated(
    await bundle.generate({
      format: 'es',
      sourcemap: true
    })
  );
  await verifySourcemap(code, map);
});
test('generates sourcemaps if enabled in plugin (camelcase)', async () => {
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      throw new Error(warning.message);
    },
    plugins: [
      replace({
        values: {
          ANSWER: '42'
        },
        sourceMap: true,
        preventAssignment: true
      }),
      testPlugin
    ]
  });
  const { code, map } = getOutputFromGenerated(
    await bundle.generate({
      format: 'es',
      sourcemap: true
    })
  );
  await verifySourcemap(code, map);
});
test('does not generate sourcemaps if disabled in plugin', async () => {
  let warned = false;
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      expect(warning.message).toBe(
        "Sourcemap is likely to be incorrect: a plugin (replace) was used to transform files, but didn't generate a sourcemap for the transformation. Consult the plugin documentation for help"
      );
      warned = true;
    },
    plugins: [
      replace({
        values: {
          ANSWER: '42'
        },
        sourcemap: false,
        preventAssignment: true
      }),
      testPlugin
    ]
  });
  expect(!warned).toBeTruthy();
  await bundle.generate({
    format: 'es',
    sourcemap: true
  });
  expect(warned).toBeTruthy();
});
test('does not generate sourcemaps if disabled in plugin (camelcase)', async () => {
  let warned = false;
  const bundle = await rollup({
    input: 'main.js',
    onwarn(warning) {
      expect(warning.message).toBe(
        "Sourcemap is likely to be incorrect: a plugin (replace) was used to transform files, but didn't generate a sourcemap for the transformation. Consult the plugin documentation for help"
      );
      warned = true;
    },
    plugins: [
      replace({
        values: {
          ANSWER: '42'
        },
        sourceMap: false,
        preventAssignment: true
      }),
      testPlugin
    ]
  });
  expect(!warned).toBeTruthy();
  await bundle.generate({
    format: 'es',
    sourcemap: true
  });
  expect(warned).toBeTruthy();
});
