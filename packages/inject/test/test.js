const fs = require('fs');
const path = require('path');

const acorn = require('acorn');
const test = require('ava');

const inject = require('..');

const compare = (t, fixture, options) => {
  const filename = path.resolve(`test/fixtures/${fixture}/input.js`);
  const input = fs.readFileSync(filename, 'utf-8');
  const output = inject(options).transform.call(
    {
      parse: (code) =>
        acorn.parse(code, {
          sourceType: 'module',
          ecmaVersion: 9
        })
    },
    input,
    filename
  );

  t.snapshot(output ? output.code : input);
};

test('inserts a default import statement', (t) => {
  compare(t, 'basic', { $: 'jquery' });
});

test('uses the modules property', (t) => {
  compare(t, 'basic', {
    modules: { $: 'jquery' }
  });
});

test('inserts a named import statement', (t) => {
  compare(t, 'named', { Promise: ['es6-promise', 'Promise'] });
});

test('overwrites keypaths', (t) => {
  compare(t, 'keypaths', {
    'Object.assign': 'fixtures/keypaths/polyfills/object-assign.js'
  });
});

test('ignores existing imports', (t) => {
  compare(t, 'existing', { $: 'jquery' });
});

test('handles shadowed variables', (t) => {
  compare(t, 'shadowing', { $: 'jquery' });
});

test('handles shorthand properties', (t) => {
  compare(t, 'shorthand', { Promise: ['es6-promise', 'Promise'] });
});

test('handles redundant keys', (t) => {
  compare(t, 'redundant-keys', {
    Buffer: 'Buffer',
    'Buffer.isBuffer': 'is-buffer'
  });
});

test('generates * imports', (t) => {
  compare(t, 'import-namespace', { foo: ['foo', '*'] });
});

test('transpiles non-JS files but handles failures to parse', (t) => {
  compare(t, 'non-js', { relative: ['path', 'relative'] });
});
