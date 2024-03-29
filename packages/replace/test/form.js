/* eslint-disable consistent-return, global-require, import/no-dynamic-require */

process.chdir(__dirname);

const { readdirSync, readFileSync } = require('fs');

const test = require('ava');

const replace = require('..');

const transformContext = {};

readdirSync('./fixtures/form').forEach((dir) => {
  let config;

  try {
    config = require(`./fixtures/form/${dir}/_config.js`);
  } catch (err) {
    config = {};
  }

  test(`${dir}: ${config.description}`, (t) => {
    const { transform } = replace(config.options);
    const extname = config.isTypescript ? 'ts' : 'js';
    const input = readFileSync(`fixtures/form/${dir}/input.${extname}`, 'utf-8');

    return Promise.resolve(
      transform.call(transformContext, input, `${__dirname}/fixtures/form/${dir}/input.${extname}`)
    ).then((transformed) => {
      const actual = (transformed ? transformed.code : input).trim();
      t.snapshot(actual);
    });
  });
});
