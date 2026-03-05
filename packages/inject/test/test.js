const fs = require('fs');
const path = require('path');
const os = require('os');

const acorn = require('acorn');

const inject = require('..');

const transform = (fixture, options) => {
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

  return output ? output.code : input;
};

const compare = (fixture, options) => {
  expect(transform(fixture, options)).toMatchSnapshot();
};

test('inserts a default import statement', () => {
  compare('basic', { $: 'jquery' });
});

test('uses the modules property', () => {
  compare('basic', {
    modules: { $: 'jquery' }
  });
});

test('escapes apostrophes in module name', () => {
  compare('basic', { $: "d'oh" });
});

// backslash is path separator on Windows,
// so it cannot appear within filename
const testIfNotWindows = os.platform() === 'win32' ? test.skip : test;

testIfNotWindows('escapes backslashes in module name', () => {
  expect(transform('basic', { $: 'slash\\back' })).toContain(
    "import { default as $ } from 'slash\\\\back';"
  );
});

test('inserts a named import statement', () => {
  compare('named', { Promise: ['es6-promise', 'Promise'] });
});

test('overwrites keypaths', () => {
  compare('keypaths', {
    'Object.assign': 'fixtures/keypaths/polyfills/object-assign.js'
  });
});

test('ignores existing imports', () => {
  compare('existing', { $: 'jquery' });
});

test('handles shadowed variables', () => {
  compare('shadowing', { $: 'jquery' });
});

test('handles shorthand properties', () => {
  compare('shorthand', { Promise: ['es6-promise', 'Promise'] });
});

test('handles shorthand properties (as assignment)', () => {
  compare('shorthand-assignment', { Promise: ['es6-promise', 'Promise'] });
});

test('handles shorthand properties in function', () => {
  compare('shorthand-func', { Promise: ['es6-promise', 'Promise'] });
});

test('handles shorthand properties in function (as fallback value)', () => {
  compare('shorthand-func-fallback', { Promise: ['es6-promise', 'Promise'] });
});

test('handles redundant keys', () => {
  compare('redundant-keys', {
    Buffer: 'Buffer',
    'Buffer.isBuffer': 'is-buffer'
  });
});

test('generates * imports', () => {
  compare('import-namespace', { foo: ['foo', '*'] });
});

test('transpiles non-JS files but handles failures to parse', () => {
  compare('non-js', { relative: ['path', 'relative'] });
});

test('ignores check isReference is false', () => {
  compare('is-reference', { bar: 'path' });
});
