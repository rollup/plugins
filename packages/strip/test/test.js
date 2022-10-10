const fs = require('fs');
const path = require('path');

const acorn = require('acorn');
const test = require('ava');

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

test('can be configured to make no changes', (t) => {
  compare(t, 'no-changes', {
    labels: [],
    functions: [],
    debugger: false
  });
});

test('excluded files do not get changed', (t) => {
  compare(t, 'excluded-not-changed', { exclude: `**/excluded-not-changed/input.js` });
});

test('removes debugger statements', (t) => {
  compare(t, 'debugger');
});

test('does not remove debugger statements with debugger: false', (t) => {
  compare(t, 'debugger-false', { debugger: false });
});

test('empty functions list leaves console statements', (t) => {
  compare(t, 'no-changes', { functions: [] });
});

test('removes console statements', (t) => {
  compare(t, 'console');
});

test('removes assert statements', (t) => {
  compare(t, 'assert');
});

test('empty functions list leaves assert statements', (t) => {
  compare(t, 'assert', { functions: [] });
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

test('rewrites expressions as void 0 in lambdas', (t) => {
  compare(t, 'lambda-void', { functions: ['console.warn'] });
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

test('removes labeled blocks when filtered function is present', (t) => {
  compare(t, 'label-block', { labels: ['unittest'], functions: ['console.*'] });
});

test('removes labeled blocks when functions list is empty', (t) => {
  compare(t, 'label-block', { labels: ['unittest'], functions: [] });
});

test('whitespace between label and colon is accepted', (t) => {
  compare(t, 'label-whitespace', { labels: ['unittest'], functions: ['console.*'] });
});

test('removing a lable also works for expressions', (t) => {
  compare(t, 'label-expression', { labels: ['unittest'] });
});

test('the same label can occur multiple times and all are removed', (t) => {
  compare(t, 'label-multiple-times', { labels: ['unittest'] });
});

test('removes labeled even with awkward spacing', (t) => {
  compare(t, 'label-awkward-spacing', { labels: ['unittest'], functions: ['console.*'] });
});

test('spaces around . in function calls are accepted', (t) => {
  compare(t, 'functions-spaced', { labels: ['unittest'], functions: ['Test.f'] });
});

test('function calls without object are replaced with (void 0)', (t) => {
  compare(t, 'functions-direct', { labels: ['unittest'], functions: ['f'] });
});
