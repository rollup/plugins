/* eslint-disable global-require, import/no-dynamic-require, no-console */

const { readdirSync } = require('fs');

const { rollup } = require('rollup');

const { commonjs, getCodeMapFromBundle, runCodeSplitTest } = require('./helpers/util');

const avaAssertions = {
  is(actual, expected, message) {
    expect(actual, message).toBe(expected);
  },
  deepEqual(actual, expected, message) {
    expect(actual, message).toEqual(expected);
  },
  truthy(value, message) {
    expect(value, message).toBeTruthy();
  },
  throws(fn, expectation) {
    try {
      fn();
    } catch (error) {
      if (expectation?.message instanceof RegExp) {
        expect(error.message).toMatch(expectation.message);
      } else if (expectation?.message) {
        expect(error.message).toBe(expectation.message);
      }

      return error;
    }

    return expect.unreachable('Expected function to throw');
  }
};

process.chdir(__dirname);
readdirSync('./fixtures/function').forEach((dir) => {
  let config;
  try {
    config = require(`./fixtures/function/${dir}/_config.js`);
  } catch (err) {
    config = {};
  }
  if (config.skip) {
    console.error(`Skipped test "${dir}"`);
    return;
  }
  (config.solo ? test.only : test)(dir, async () => {
    const options = Object.assign(
      {
        input: `fixtures/function/${dir}/${config.input || 'main.js'}`
      },
      config.options || {},
      {
        plugins: [
          ...((config.options && config.options.plugins) || []),
          commonjs(config.pluginOptions)
        ]
      }
    );
    const bundle = await rollup(options);
    const codeMap = await getCodeMapFromBundle(bundle, options.output || {});
    if (config.show || config.solo) {
      console.error();
      for (const chunkName of Object.keys(codeMap)) {
        console.error();
        console.error(`===> ${chunkName}`);
        console.group();
        console.error(codeMap[chunkName]);
        console.groupEnd();
      }
    }
    const { exports, global, error } = runCodeSplitTest(
      codeMap,
      avaAssertions,
      config.testEntry || 'main.js',
      config.context
    );
    if (config.exports) config.exports(exports, avaAssertions);
    if (config.global) config.global(global, avaAssertions);
    if (error) {
      throw error;
    }
    expect(codeMap).toMatchSnapshot();
  });
});
