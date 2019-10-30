const fs = require('fs');
const path = require('path');

const acorn = require('acorn');
const test = require('ava');

// eslint-disable-next-line import/no-unresolved
const strip = require('..');

const compare = (t, fixture, options) => {
  const filename = path.resolve(`test/fixtures/${fixture}/input.js`);
  const input = fs.readFileSync(filename, 'utf-8');
  const output = strip(options).transform.call(
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

test('removes debugger statements', (t) => {
  compare(t, 'debugger');
});

test('does not remove debugger statements with debugger: false', (t) => {
  compare(t, 'debugger-false', { debugger: false });
});

test('removes console statements', (t) => {
  compare(t, 'console');
});

test('removes assert statements', (t) => {
  compare(t, 'assert');
});

test('leaves console statements if custom functions are provided', (t) => {
  compare(t, 'console-custom', { functions: ['console.log'] });
});

test('removes custom functions', (t) => {
  compare(t, 'custom', { functions: ['debug', 'custom.*'] });
});

test('rewrtestes inline call expressions (not expression statements) as void 0', (t) => {
  compare(t, 'inline-call-expressions');
});

test('rewrtestes inline if expessions as void 0', (t) => {
  compare(t, 'inline-if');
});

test('removes expressions in if blocks', (t) => {
  compare(t, 'if-block');
});

test('removes methods of this', (t) => {
  compare(t, 'this-method', { functions: ['this.*'] });
});

test('removes super calls', (t) => {
  compare(t, 'super-method', { functions: ['super.log'] });
});

test('replaces case body with void 0', (t) => {
  compare(t, 'switch-case');
});

test('rewrtestes inline while expressions as void 0', (t) => {
  compare(t, 'inline-while');
});

test('supports object destructuring assignments with default values', (t) => {
  compare(t, 'object-destructuring-default');
});

test('removes labeled blocks', (t) => {
  compare(t, 'label-block', { labels: ['untesttest'] });
});

test('removes multiple labeled blocks', (t) => {
  compare(t, 'label-block-multiple', { labels: ['first', 'second'] });
});

test('only removes specified blocks', (t) => {
  compare(t, 'label-block-discriminate', { labels: ['second'] });
});
