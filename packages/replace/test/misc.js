/* eslint-disable consistent-return */

const test = require('ava');
const { rollup } = require('rollup');

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

test('can be configured with output plugins', async (t) => {
  const bundle = await rollup({
    input: 'main.js',
    plugins: [
      {
        resolveId(id) {
          return id;
        },
        load(importee) {
          if (importee === 'main.js') {
            return 'log("environment", process.env.NODE_ENV);';
          }
        }
      }
    ]
  });

  const { code, map } = getOutputFromGenerated(
    await bundle.generate({
      format: 'es',
      sourcemap: true,
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          delimiters: ['', '']
        })
      ]
    })
  );

  t.is(code.trim(), 'log("environment", "production");');
  t.truthy(map);
});
