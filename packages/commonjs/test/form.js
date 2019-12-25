/* eslint-disable global-require, import/no-dynamic-require, no-console */

import { existsSync, readdirSync, readFileSync } from 'fs';

import * as acorn from 'acorn';
import test from 'ava';

import { commonjs } from './helpers/util';

process.chdir(__dirname);

const transformContext = {
  parse: (input, options) =>
    acorn.parse(input, {
      ecmaVersion: 9,
      sourceType: 'module',
      ...options
    })
};

readdirSync('./fixtures/form').forEach((dir) => {
  let config;

  try {
    config = require(`./fixtures/form/${dir}/_config.js`);
  } catch (err) {
    config = {};
  }

  (config.solo ? test.only : test)(dir, async (t) => {
    const { transform } = commonjs(config.options);
    const id = `./fixtures/form/${dir}/input.js`;

    transformContext.getModuleInfo = (moduleId) => {
      return {
        isEntry: config.entry && moduleId === id
      };
    };
    transformContext.error = (base, props) => {
      let error = base;
      if (!(base instanceof Error)) error = Object.assign(new Error(base.message), base);
      if (props) Object.assign(error, props);
      throw error;
    };

    const input = readFileSync(id, 'utf-8');

    let outputFile = `fixtures/form/${dir}/output`;
    if (existsSync(`${outputFile}.${process.platform}.js`)) {
      outputFile += `.${process.platform}.js`;
    } else {
      outputFile += '.js';
    }

    const expected = readFileSync(outputFile, 'utf-8').trim();

    const transformed = transform.call(transformContext, input, id);
    const actual = (transformed ? transformed.code : input).trim().replace(/\0/g, '_');
    t.is(actual, expected);
  });
});
