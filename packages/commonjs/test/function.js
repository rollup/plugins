/* eslint-disable global-require, import/no-dynamic-require, no-console */

const { readdirSync } = require('fs');

const test = require('ava');
const { rollup } = require('rollup');

const { commonjs, getCodeMapFromBundle, runCodeSplitTest } = require('./helpers/util');

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
  (config.solo ? test.only : test)(dir, async (t) => {
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
      t,
      config.testEntry || 'main.js',
      config.context
    );

    if (config.exports) config.exports(exports, t);
    if (config.global) config.global(global, t);
    if (error) {
      throw error;
    }
    t.snapshot(codeMap);
  });
});
