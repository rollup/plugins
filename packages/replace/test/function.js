/* eslint-disable consistent-return, global-require, import/no-dynamic-require */

process.chdir(__dirname);
const { readdirSync } = require('fs');

const { rollup } = require('rollup');

const replace = require('..');

const { execute, getCodeFromBundle } = require('./helpers/util');

const avaAssertions = {
  is(actual, expected) {
    expect(actual).toBe(expected);
  },
  pass() {
    expect(true).toBe(true);
  }
};
readdirSync('./fixtures/function').forEach((dir) => {
  let config;
  try {
    config = require(`./fixtures/function/${dir}/_config.js`);
  } catch (err) {
    config = {};
  }
  test(`${dir}: ${config.description}`, async () => {
    const options = Object.assign(
      {
        input: `fixtures/function/${dir}/main.js`
      },
      config.options || {},
      {
        plugins: [
          ...((config.options && config.options.plugins) || []),
          replace(config.pluginOptions)
        ]
      }
    );
    const bundle = await rollup(options);
    const code = await getCodeFromBundle(bundle);
    const exports = execute(code, config.context, avaAssertions);
    if (config.exports) config.exports(exports);
  });
});
