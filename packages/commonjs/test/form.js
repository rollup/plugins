/* eslint-disable global-require, import/no-dynamic-require, no-console */

import * as fs from 'fs';
import * as path from 'path';

import * as acorn from 'acorn';
import test from 'ava';

import { commonjs } from './helpers/util';

process.chdir(__dirname);

const transformContext = {
  error: (base, props) => {
    let error = base;
    if (!(base instanceof Error)) error = Object.assign(new Error(base.message), base);
    if (props) Object.assign(error, props);
    throw error;
  },
  load: ({ id }) => Promise.resolve({ id, meta: {} }),
  parse: (input, options) =>
    acorn.parse(input, {
      ecmaVersion: 9,
      sourceType: 'module',
      ...options
    }),
  resolve: (source, importer) =>
    Promise.resolve({
      id: `${path.resolve(path.dirname(importer), source)}${path.extname(source) ? '' : '.js'}`
    })
};

// Do not run on Windows as we have full path names in the output
if (path.sep === '/') {
  fs.readdirSync('./fixtures/form').forEach((dir) => {
    let config;

    try {
      config = require(`./fixtures/form/${dir}/_config.js`);
    } catch (err) {
      config = {};
    }

    const inputEntries = [];

    if (typeof config.multi === 'object') {
      for (const [key, entry] of Object.entries(config.multi)) {
        inputEntries.push([key, `fixtures/form/${dir}/${entry}`]);
      }
    } else {
      inputEntries.push(['output', `fixtures/form/${dir}/input.js`]);
    }

    (config.solo ? test.only : test)(dir, (t) =>
      Promise.all(
        inputEntries.map(async ([outputName, id]) => {
          const { buildStart, transform } = commonjs(config.options);
          buildStart.call({ meta: { rollupVersion: '99.0.0' } }, { plugins: [] });
          transformContext.getModuleInfo = (moduleId) => {
            return {
              isEntry: config.entry && moduleId === id,
              importers:
                config.importers && config.importers[outputName]
                  ? config.importers[outputName].map((x) => `fixtures/form/${dir}/${x}`)
                  : [],
              meta: {}
            };
          };
          const input = fs.readFileSync(id, 'utf-8');

          let outputFile = `fixtures/form/${dir}/${outputName}`;
          if (fs.existsSync(`${outputFile}.${process.platform}.js`)) {
            outputFile += `.${process.platform}.js`;
          } else {
            outputFile += '.js';
          }

          const expected = fs.readFileSync(outputFile, 'utf-8').trim();
          // eslint-disable-next-line no-await-in-loop
          const transformed = await transform.call(transformContext, input, id);
          let actual = (transformed ? transformed.code : input).trim().replace(/\0/g, '_');
          const cwd = process.cwd();
          while (actual.indexOf(cwd) >= 0) {
            actual = actual.replace(process.cwd(), 'CWD');
          }

          // uncomment to update snapshots
          // fs.writeFileSync(outputFile, `${actual}\n`);

          // trim whitespace from line endings,
          // this will benefit issues like `form/try-catch-remove` where whitespace is left in the line,
          // and testing on windows (\r\n)
          t.is(
            actual
              .split('\n')
              .map((x) => x.trimEnd())
              .join('\n'),
            expected
              .split('\n')
              .map((x) => x.trimEnd())
              .join('\n')
          );
        })
      )
    );
  });
}
