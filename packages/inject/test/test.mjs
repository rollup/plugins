import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as acorn from 'acorn';
import test from 'ava';

import inject from 'current-package';

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

test('escapes apostrophes in module name', (t) => {
  compare(t, 'basic', { $: "d'oh" });
});

if (os.platform() === 'win32') {
  // backslash is path separator on Windows,
  // so it cannot appear within filename
} else {
  test('escapes backslashes in module name', (t) => {
    compare(t, 'basic', { $: 'slash\\back' });
  });
}

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

test('handles shorthand properties (as assignment)', (t) => {
  compare(t, 'shorthand-assignment', { Promise: ['es6-promise', 'Promise'] });
});

test('handles shorthand properties in function', (t) => {
  compare(t, 'shorthand-func', { Promise: ['es6-promise', 'Promise'] });
});

test('handles shorthand properties in function (as fallback value)', (t) => {
  compare(t, 'shorthand-func-fallback', { Promise: ['es6-promise', 'Promise'] });
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

test('ignores check isReference is false', (t) => {
  compare(t, 'is-reference', { bar: 'path' });
});
