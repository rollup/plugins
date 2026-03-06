/* eslint-disable consistent-return */

const { join } = require('path');

const { rollup } = require('rollup');

const replace = require('..');

const { getOutputFromGenerated } = require('./helpers/util');

test('does not mutate the values map properties', async () => {
  const valuesMap = {
    ANSWER: '42'
  };
  const bundle = await rollup({
    input: 'main.js',
    plugins: [
      replace({
        values: valuesMap
      }),
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
  const { code } = getOutputFromGenerated(
    await bundle.generate({
      format: 'es'
    })
  );
  expect(code.trim()).toBe('log(42);');
  expect(valuesMap).toEqual({
    ANSWER: '42'
  });
});
test('can be configured with output plugins', async () => {
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
  expect(code.trim()).toBe('log("environment", "production");\n//# sourceMappingURL=main.js.map');
  expect(map).toBeTruthy();
});
process.chdir(join(__dirname, 'fixtures', 'form', 'assignment'));
test.sequential('no explicit setting of preventAssignment', async () => {
  // eslint-disable-next-line no-undefined
  const possibleValues = [undefined, true, false];
  for await (const value of possibleValues) {
    const warnings = [];
    await rollup({
      input: 'input.js',
      onwarn: (warning) => warnings.push(warning),
      plugins: [
        replace({
          preventAssignment: value
        })
      ]
    });
    expect(warnings).toMatchSnapshot();
  }
});
