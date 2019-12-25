/* eslint-disable global-require, import/no-dynamic-require, no-console */

import { readdirSync } from 'fs';

import test from 'ava';
import { rollup } from 'rollup';

import { commonjs, getCodeFromBundle, execute } from './helpers/util';

process.chdir(__dirname);

readdirSync('./fixtures/function').forEach((dir) => {
  let config;

  try {
    config = require(`./fixtures/function/${dir}/_config.js`);
  } catch (err) {
    config = {};
  }

  (config.solo ? test.only : test)(dir, async (t) => {
    const options = Object.assign(
      {
        input: `fixtures/function/${dir}/main.js`
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
    const code = await getCodeFromBundle(bundle);
    if (config.show || config.solo) {
      console.error(code);
    }

    const { exports, global } = execute(code, config.context, t);

    if (config.exports) config.exports(exports, t);
    if (config.global) config.global(global, t);
  });
});
