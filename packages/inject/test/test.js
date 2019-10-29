const assert = require('assert');
const path = require('path');

const { rollup } = require('rollup');

const test = require('ava');

const inject = require('..');

process.chdir(__dirname);

test('inserts a default import statement', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [inject({ $: 'jquery' })],
    external: ['jquery']
  });

  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf("import $ from 'jquery'"), -1, code);
});

test('uses the modules property', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/basic/main.js',
    plugins: [
      inject({
        modules: { $: 'jquery' }
      })
    ],
    external: ['jquery']
  });

  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf("import $ from 'jquery'"), -1, code);
});

test('inserts a named import statement', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/named/main.js',
    plugins: [inject({ Promise: ['es6-promise', 'Promise'] })],
    external: ['es6-promise']
  });

  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf("import { Promise } from 'es6-promise'"), -1, code);
});

test('overwrites keypaths', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/keypaths/main.js',
    plugins: [
      inject({
        'Object.assign': path.resolve('fixtures/keypaths/polyfills/object-assign.js')
      })
    ]
  });
  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf('clone = $inject_Object_assign'), -1, code);
  t.not(code.indexOf('$inject_Object_assign ='), -1, code);
});

test('ignores existing imports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/existing/main.js',
    plugins: [inject({ $: 'jquery' })],
    external: ['jquery']
  });
  let {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  // remove first instance. there shouldn't be a second
  code = code.replace(/import \$.+/, '');

  t.is(code.indexOf("import $ from 'jquery'"), -1, code);
});

test('handles shadowed variables', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/shadowing/main.js',
    plugins: [inject({ $: 'jquery' })],
    external: ['jquery']
  });
  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.is(code.indexOf("'jquery'"), -1, code);
});

test('handles shorthand properties', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/shorthand/main.js',
    plugins: [inject({ Promise: ['es6-promise', 'Promise'] })],
    external: ['es6-promise']
  });
  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf("import { Promise } from 'es6-promise'"), -1, code);
});

test('handles redundant keys', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/redundant-keys/main.js',
    plugins: [
      inject({
        Buffer: 'Buffer',
        'Buffer.isBuffer': 'is-buffer'
      })
    ],
    external: ['Buffer', 'is-buffer']
  });

  const {
    output: [{ imports }]
  } = await bundle.generate({ format: 'es' });

  t.deepEqual(imports, ['is-buffer']);
});

test('generates * imports', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/import-namespace/main.js',
    plugins: [inject({ foo: ['foo', '*'] })],
    external: ['foo']
  });
  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  t.not(code.indexOf("import { bar, baz } from 'foo'"), -1, code);
});

test('transpiles non-JS files but handles failures to parse', async (t) => {
  const bundle = await rollup({
    input: 'fixtures/non-js/main.js',
    plugins: [
      inject({ relative: ['path', 'relative'] }),
      {
        transform(code, id) {
          if (/css/.test(id)) {
            return '';
          }
          return null;
        }
      }
    ],
    external: ['path']
  });
  const {
    output: [{ code }]
  } = await bundle.generate({ format: 'es' });

  const fn = new Function('require', 'path', 'assert', code); // eslint-disable-line no-new-func
  t.notThrows(() => fn(require, path, assert));
});
